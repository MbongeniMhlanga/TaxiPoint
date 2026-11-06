package za.co.taxipoint.dto;

import java.util.List;

public record AiTripPlan(
        String origin,
        String destination,
        String summary,
        List<AiTripOption> options
) {
}
