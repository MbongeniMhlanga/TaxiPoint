package za.co.taxipoint.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import za.co.taxipoint.model.Incident;
import za.co.taxipoint.model.TaxiRank;
import za.co.taxipoint.dto.AiTripOption;
import za.co.taxipoint.repository.IncidentRepository;
import za.co.taxipoint.repository.TaxiRankRepository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiContextService {

    private static final int MAX_RANKS = 100;
    private static final int MAX_INCIDENTS = 100;
    private static final Set<String> STOP_WORDS = Set.of(
            "the", "and", "for", "are", "near", "from", "with", "what", "where", "which", "how",
            "does", "there", "this", "that", "have", "any", "about", "please", "find", "show", "tell",
            "taxi", "rank", "ranks", "route", "routes", "fare", "fares", "price", "prices", "cost", "costs",
            "many", "much", "number", "trip", "current", "currently"
    );

    private final TaxiRankRepository taxiRankRepository;
    private final IncidentRepository incidentRepository;

    public String buildContext(String question) {
        return buildContext(question, null, null);
    }

    public String buildContext(String question, Double latitude, Double longitude) {
        List<TaxiRank> ranks = findRelevantRanks(question, latitude, longitude);
        List<Incident> incidents = incidentRepository.findByResolvedFalseOrderByCreatedAtDesc()
                .stream()
                .limit(MAX_INCIDENTS)
                .toList();

        StringBuilder context = new StringBuilder();
        context.append("This context was retrieved from the TaxiPoint database. It is the source of truth.\n\n");
        if (latitude != null && longitude != null) {
            context.append("USER LOCATION IS AVAILABLE: latitude=")
                    .append(latitude)
                    .append(", longitude=")
                    .append(longitude)
                    .append(". The taxi ranks listed below were selected as nearby options for this location. Do not say that the user's location is unavailable.\n\n");
        } else {
            context.append("USER LOCATION IS NOT AVAILABLE. Do not describe any rank as being near the user.\n\n");
        }
        context.append("TOTAL ACTIVE TAXI RANKS: ").append(taxiRankRepository.countActive()).append("\n\n");
        appendRanks(context, ranks);
        appendIncidents(context, incidents);
        appendAppGuide(context);
        return context.toString();
    }

    public List<AiTripOption> buildTripOptions(String question) {
        return buildTripOptions(question, null, null);
    }

    public List<AiTripOption> buildTripOptions(String question, Double latitude, Double longitude) {
        String normalizedQuestion = question == null ? "" : question.toLowerCase(Locale.ROOT);
        boolean tripQuestion = normalizedQuestion.contains("rank")
                || normalizedQuestion.contains("route")
                || normalizedQuestion.contains("fare")
                || normalizedQuestion.contains("price")
                || normalizedQuestion.contains("cost")
                || normalizedQuestion.contains("delay")
                || normalizedQuestion.contains("incident")
                || normalizedQuestion.contains("near me")
                || normalizedQuestion.contains("go to")
                || normalizedQuestion.contains("travel")
                || normalizedQuestion.contains("commute");
        if (!tripQuestion) return List.of();

        List<Incident> incidents = incidentRepository.findByResolvedFalseOrderByCreatedAtDesc();
        return findRelevantRanks(question, latitude, longitude).stream()
                .limit(5)
                .map(rank -> new AiTripOption(
                        rank.getId() == null ? null : rank.getId().toString(),
                        rank.getName(),
                        rank.getAddress(),
                        rank.getDistrict(),
                        rank.getRoutesServed() == null ? List.of() : rank.getRoutesServed(),
                        rank.getRouteFares() == null ? java.util.Map.of() : rank.getRouteFares(),
                        rank.getCurrency() == null ? "ZAR" : rank.getCurrency(),
                        rank.getLocation() == null ? null : rank.getLocation().getY(),
                        rank.getLocation() == null ? null : rank.getLocation().getX(),
                        incidents.stream()
                                .filter(incident -> isRelevantIncident(rank, incident))
                                .limit(3)
                                .map(incident -> new AiTripOption.AiTripIncident(
                                        incident.getId(), incident.getDescription(),
                                        incident.getCreatedAt() == null ? null : incident.getCreatedAt().toString()))
                                .toList()
                ))
                .toList();
    }

    private boolean isRelevantIncident(TaxiRank rank, Incident incident) {
        if (rank.getLocation() == null || incident.getLocation() == null) return false;
        double latDistance = (rank.getLocation().getY() - incident.getLocation().getY()) * 111_000;
        double lngDistance = (rank.getLocation().getX() - incident.getLocation().getX()) * 111_000
                * Math.cos(Math.toRadians(rank.getLocation().getY()));
        return Math.sqrt(latDistance * latDistance + lngDistance * lngDistance) <= 5_000;
    }

    private List<TaxiRank> findRelevantRanks(String question) {
        return findRelevantRanks(question, null, null);
    }

    private List<TaxiRank> findRelevantRanks(String question, Double latitude, Double longitude) {
        if (latitude != null && longitude != null
                && latitude >= -90 && latitude <= 90
                && longitude >= -180 && longitude <= 180) {
            List<TaxiRank> nearby = taxiRankRepository.findNearbyWithDistance(latitude, longitude, 50_000d);
            if (!nearby.isEmpty()) return nearby.stream().limit(MAX_RANKS).toList();
        }

        Set<String> terms = Arrays.stream(question.toLowerCase(Locale.ROOT).split("[^a-z0-9]+"))
                .filter(term -> term.length() >= 3 && !STOP_WORDS.contains(term))
                .limit(5)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (terms.isEmpty()) {
            return taxiRankRepository.findActive(PageRequest.of(0, MAX_RANKS)).getContent();
        }

        List<TaxiRank> matches = new ArrayList<>();
        for (String term : terms) {
            taxiRankRepository.searchByNameOrAddressOrRoutesOrDistrict(term).forEach(rank -> {
                if (!matches.contains(rank) && matches.size() < MAX_RANKS) {
                    matches.add(rank);
                }
            });
            if (matches.size() >= MAX_RANKS) break;
        }
        // For broad questions such as rank counts, include a representative set of
        // active records even when the extracted words do not match a location.
        if (matches.isEmpty()) {
            return taxiRankRepository.findActive(PageRequest.of(0, MAX_RANKS)).getContent();
        }
        return matches;
    }

    private void appendRanks(StringBuilder context, List<TaxiRank> ranks) {
        context.append("TAXI RANKS (active records only):\n");
        if (ranks.isEmpty()) {
            context.append("No matching active taxi ranks were found.\n");
            return;
        }

        for (TaxiRank rank : ranks) {
            context.append("- ").append(rank.getName());
            if (rank.getDistrict() != null) context.append(" | district: ").append(rank.getDistrict());
            if (rank.getAddress() != null) context.append(" | address: ").append(rank.getAddress());
            if (rank.getRoutesServed() != null && !rank.getRoutesServed().isEmpty()) {
                context.append(" | routes: ").append(String.join(", ", rank.getRoutesServed()));
            }
            if (rank.getRouteFares() != null && !rank.getRouteFares().isEmpty()) {
                context.append(" | fares (").append(rank.getCurrency() == null ? "ZAR" : rank.getCurrency())
                        .append("): ").append(rank.getRouteFares());
            }
            if (rank.getHours() != null && !rank.getHours().isEmpty()) context.append(" | hours: ").append(rank.getHours());
            if (rank.getDescription() != null) context.append(" | description: ").append(rank.getDescription());
            if (rank.getPhone() != null) context.append(" | phone: ").append(rank.getPhone());
            if (rank.getFacilities() != null && !rank.getFacilities().isEmpty()) context.append(" | facilities: ").append(rank.getFacilities());
            if (rank.getLocation() != null) {
                context.append(" | coordinates: ").append(rank.getLocation().getY()).append(", ").append(rank.getLocation().getX());
            }
            if (rank.getUpdatedAt() != null) context.append(" | last updated: ").append(rank.getUpdatedAt());
            context.append("\n");
        }
    }

    private void appendIncidents(StringBuilder context, List<Incident> incidents) {
        context.append("\nACTIVE INCIDENTS (unresolved records only):\n");
        if (incidents.isEmpty()) {
            context.append("No unresolved incidents are currently recorded.\n");
            return;
        }

        for (Incident incident : incidents) {
            context.append("- ").append(incident.getDescription());
            if (incident.getCreatedAt() != null) context.append(" | reported: ").append(incident.getCreatedAt());
            if (incident.getLocation() != null) {
                context.append(" | coordinates: ").append(incident.getLocation().getY()).append(", ").append(incident.getLocation().getX());
            }
            context.append("\n");
        }
    }

    private void appendAppGuide(StringBuilder context) {
        context.append("\nTAXIPOINT APP GUIDE (verified product information):\n")
                .append("- Support: users can contact TaxiPoint Support at taxipoint25@gmail.com. Include the account email, subject, and a description of the issue.\n")
                .append("- Home: use the map to explore taxi ranks, view rank details, search ranks, and review reported incidents.\n")
                .append("- Taxi rank details: select a rank to view its address, routes, fares, operating hours, phone number, facilities, and location when available.\n")
                .append("- Corrections: open a taxi rank, choose the correction option, describe the inaccurate or missing information, and submit it. Users can view submitted corrections under Corrections; administrators review them.\n")
                .append("- Profile: update personal account details. Settings contains preferences such as notifications, sound alerts, automatic refresh, location sharing, and dark mode.\n")
                .append("- Incidents: users can report delays, safety concerns, and route disruptions from the map. Unresolved incidents are shown as current alerts; users should verify urgent safety information independently.\n")
                .append("- Assistant limitations: never claim a route, fare, rank, incident, opening time, or contact detail unless it appears in the database context or this verified app guide.\n");
    }
}
