package za.co.taxipoint.dto;

import java.util.List;

public record AiRouteLeg(
        String from,
        String to,
        double distanceMeters,
        long durationSeconds,
        List<String> directions
) {
}
