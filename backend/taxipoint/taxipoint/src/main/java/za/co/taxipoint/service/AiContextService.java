package za.co.taxipoint.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import za.co.taxipoint.model.Incident;
import za.co.taxipoint.model.TaxiRank;
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
        List<TaxiRank> ranks = findRelevantRanks(question);
        List<Incident> incidents = incidentRepository.findByResolvedFalseOrderByCreatedAtDesc()
                .stream()
                .limit(MAX_INCIDENTS)
                .toList();

        StringBuilder context = new StringBuilder();
        context.append("This context was retrieved from the TaxiPoint database. It is the source of truth.\n\n");
        context.append("TOTAL ACTIVE TAXI RANKS: ").append(taxiRankRepository.countActive()).append("\n\n");
        appendRanks(context, ranks);
        appendIncidents(context, incidents);
        appendAppGuide(context);
        return context.toString();
    }

    private List<TaxiRank> findRelevantRanks(String question) {
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
