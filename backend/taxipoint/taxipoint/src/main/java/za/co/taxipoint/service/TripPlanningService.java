package za.co.taxipoint.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import za.co.taxipoint.dto.AiRouteLeg;
import za.co.taxipoint.dto.AiTripOption;
import za.co.taxipoint.dto.AiTripPlan;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class TripPlanningService {

    private static final Pattern NATURAL_TRIP = Pattern.compile(
            "(?i)(?:i(?:'m|’m| am)\\s+(?:in|at|near)\\s+|from\\s+)(.+?)\\s+(?:and\\s+)?(?:need\\s+to\\s+get\\s+to|want\\s+to\\s+go\\s+to|going\\s+to|to)\\s+(.+?)(?=\\s+(?:before|by|at)\\s+\\d|\\s+(?:cheapest|fastest|safest|avoid)\\b|[?.!,]|$)");
    private static final Pattern SIMPLE_TRIP = Pattern.compile("(?i)\\bfrom\\s+(.+?)\\s+to\\s+(.+?)(?=\\s+(?:before|by|at)\\s+\\d|[?.!,]|$)");
    private static final Pattern TIME = Pattern.compile("(?i)\\b(?:before|by|at)\\s+(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?)");

    private final AiContextService contextService;
    private final GeocodingService geocodingService;
    private final RoutePlanningService routePlanningService;

    public AiTripPlan plan(String question, Double userLatitude, Double userLongitude) {
        TripIntent intent = extractIntent(question);
        if (intent == null) return null;

        GeocodingService.GeoPoint origin = isCurrentLocation(intent.origin()) && userLatitude != null && userLongitude != null
                ? new GeocodingService.GeoPoint(userLatitude, userLongitude, "Your current location")
                : geocodingService.geocode(intent.origin());
        GeocodingService.GeoPoint destination = geocodingService.geocode(intent.destination());
        List<AiTripOption> candidates = contextService.buildTripOptions(question, userLatitude, userLongitude);

        if (origin == null || destination == null) {
            return new AiTripPlan(intent.origin(), intent.destination(), intent.requestedTime(), intent.constraint(),
                    "I could not locate both places accurately enough to calculate this trip.",
                    origin == null ? null : origin.latitude(), origin == null ? null : origin.longitude(),
                    destination == null ? null : destination.latitude(), destination == null ? null : destination.longitude(),
                    0, 0, null, List.of(), candidates);
        }

        List<AiTripOption> destinationMatches = candidates.stream()
                .filter(option -> option.routes().stream().anyMatch(route -> matches(route, intent.destination()))
                        || option.fares().keySet().stream().anyMatch(route -> matches(route, intent.destination())))
                .toList();
        if (!destinationMatches.isEmpty()) candidates = destinationMatches;

        List<RankRoute> ranked = candidates.stream()
                .filter(option -> option.latitude() != null && option.longitude() != null)
                .map(option -> routeCandidate(option, origin, destination))
                .filter(candidate -> candidate != null)
                .toList();

        if (ranked.isEmpty()) {
            return new AiTripPlan(intent.origin(), intent.destination(), intent.requestedTime(), intent.constraint(),
                    "I found the destination, but I could not calculate a road route from the available taxi ranks.",
                    origin.latitude(), origin.longitude(), destination.latitude(), destination.longitude(),
                    0, 0, directionsUrl(origin, destination), List.of(), candidates);
        }

        List<RankRoute> ordered = applyConstraint(ranked, intent.constraint());
        RankRoute selected = ordered.get(0);
        String summary = buildSummary(intent, selected, ordered.size());
        return new AiTripPlan(intent.origin(), intent.destination(), intent.requestedTime(), intent.constraint(), summary,
                origin.latitude(), origin.longitude(), destination.latitude(), destination.longitude(),
                selected.totalDistanceMeters(), selected.totalDurationSeconds(),
                directionsUrl(origin, selected.option(), destination), selected.legs(),
                ordered.stream().map(RankRoute::option).toList());
    }

    private RankRoute routeCandidate(AiTripOption option, GeocodingService.GeoPoint origin,
                                     GeocodingService.GeoPoint destination) {
        RoutePlanningService.RouteResult first = routePlanningService.route(origin.latitude(), origin.longitude(), option.latitude(), option.longitude());
        RoutePlanningService.RouteResult second = routePlanningService.route(option.latitude(), option.longitude(), destination.latitude(), destination.longitude());
        if (first == null || second == null) return null;
        return new RankRoute(option,
                first.distanceMeters() + second.distanceMeters(),
                first.durationSeconds() + second.durationSeconds(),
                List.of(new AiRouteLeg(origin.displayName(), option.name(), first.distanceMeters(), first.durationSeconds(), first.directions()),
                        new AiRouteLeg(option.name(), destination.displayName(), second.distanceMeters(), second.durationSeconds(), second.directions())));
    }

    private List<RankRoute> applyConstraint(List<RankRoute> routes, String constraint) {
        String normalized = constraint.toLowerCase(Locale.ROOT);
        List<RankRoute> working = routes;
        if (normalized.contains("safest") || normalized.contains("avoid incident")) {
            List<RankRoute> clear = routes.stream().filter(route -> route.option().incidents().isEmpty()).toList();
            if (!clear.isEmpty()) working = clear;
            return working.stream().sorted(Comparator.comparingInt(route -> route.option().incidents().size())).toList();
        }
        if (normalized.contains("cheapest")) {
            return working.stream().sorted(Comparator.comparingDouble(route -> fareFor(route.option()))).toList();
        }
        return working.stream().sorted(Comparator.comparingLong(RankRoute::totalDurationSeconds)).toList();
    }

    private double fareFor(AiTripOption option) {
        return option.fares().values().stream().mapToDouble(Double::doubleValue).min().orElse(Double.MAX_VALUE);
    }

    private String buildSummary(TripIntent intent, RankRoute selected, int count) {
        long minutes = Math.max(1, Math.round(selected.totalDurationSeconds() / 60.0));
        double km = selected.totalDistanceMeters() / 1000.0;
        String preference = intent.constraint().isBlank() ? "best available" : intent.constraint();
        return String.format(Locale.ROOT, "%s option via %s: approximately %.1f km and %d minutes. %d option(s) matched.",
                capitalize(preference), selected.option().name(), km, minutes, count);
    }

    private String directionsUrl(GeocodingService.GeoPoint origin, AiTripOption rank, GeocodingService.GeoPoint destination) {
        return "https://www.google.com/maps/dir/?api=1&origin=" + origin.latitude() + "," + origin.longitude()
                + "&destination=" + destination.latitude() + "," + destination.longitude()
                + "&waypoints=" + rank.latitude() + "," + rank.longitude();
    }

    private String directionsUrl(GeocodingService.GeoPoint origin, GeocodingService.GeoPoint destination) {
        return "https://www.google.com/maps/dir/?api=1&origin=" + origin.latitude() + "," + origin.longitude()
                + "&destination=" + destination.latitude() + "," + destination.longitude();
    }

    private boolean matches(String value, String query) {
        String left = value == null ? "" : value.toLowerCase(Locale.ROOT);
        String right = query == null ? "" : query.toLowerCase(Locale.ROOT).trim();
        return left.contains(right) || right.contains(left);
    }

    private boolean isCurrentLocation(String origin) {
        String value = origin.toLowerCase(Locale.ROOT);
        return value.contains("my location") || value.contains("current location") || value.equals("here");
    }

    private TripIntent extractIntent(String question) {
        if (question == null || question.isBlank()) return null;
        Matcher matcher = NATURAL_TRIP.matcher(question.trim());
        boolean found = matcher.find();
        if (!found) {
            matcher = SIMPLE_TRIP.matcher(question.trim());
            found = matcher.find();
        }
        if (!found) return null;
        String origin = clean(matcher.group(1));
        String destination = clean(matcher.group(2));
        Matcher timeMatcher = TIME.matcher(question);
        String requestedTime = timeMatcher.find() ? timeMatcher.group(1).trim() : "";
        String lower = question.toLowerCase(Locale.ROOT);
        String constraint = lower.contains("cheapest") ? "cheapest"
                : lower.contains("fastest") ? "fastest"
                : lower.contains("safest") ? "safest"
                : lower.contains("avoid") && lower.contains("incident") ? "avoid incidents" : "";
        return origin.isBlank() || destination.isBlank() ? null : new TripIntent(origin, destination, requestedTime, constraint);
    }

    private String clean(String value) {
        return value.replaceFirst("(?i)^(a trip|the trip|taxi trip)\\s+", "").trim();
    }

    private String capitalize(String value) {
        return value.isBlank() ? "Best available" : Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }

    private record TripIntent(String origin, String destination, String requestedTime, String constraint) {
    }

    private record RankRoute(AiTripOption option, double totalDistanceMeters, long totalDurationSeconds,
                             List<AiRouteLeg> legs) {
    }
}
