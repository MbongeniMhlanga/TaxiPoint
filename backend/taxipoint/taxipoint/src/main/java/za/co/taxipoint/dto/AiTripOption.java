package za.co.taxipoint.dto;

import java.util.List;
import java.util.Map;

public record AiTripOption(
        String rankId,
        String name,
        String address,
        String district,
        List<String> routes,
        Map<String, Double> fares,
        String currency,
        Double latitude,
        Double longitude,
        List<AiTripIncident> incidents
) {
    public record AiTripIncident(Long id, String description, String createdAt) {
    }
}
