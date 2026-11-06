package za.co.taxipoint.dto;

import java.util.List;

public record AiTripPlan(
        String origin,
        String destination,
        String requestedTime,
        String constraint,
        String summary,
        Double originLatitude,
        Double originLongitude,
        Double destinationLatitude,
        Double destinationLongitude,
        double totalDistanceMeters,
        long totalDurationSeconds,
        String directionsUrl,
        List<AiRouteLeg> legs,
        List<AiTripOption> options
) {
}
