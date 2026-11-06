package za.co.taxipoint.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class RoutePlanningService {

    private static final String OSRM_URL = "https://router.project-osrm.org/route/v1/driving/";
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public RouteResult route(double fromLatitude, double fromLongitude, double toLatitude, double toLongitude) {
        try {
            String url = OSRM_URL + fromLongitude + "," + fromLatitude + ";"
                    + toLongitude + "," + toLatitude + "?overview=false&steps=true";
            String body = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(body);
            JsonNode route = root.path("routes").path(0);
            if (route.isMissingNode()) return null;

            List<String> directions = new ArrayList<>();
            for (JsonNode leg : route.path("legs")) {
                for (JsonNode step : leg.path("steps")) {
                    String name = step.path("name").asText("").trim();
                    String type = step.path("maneuver").path("type").asText("").trim();
                    String modifier = step.path("maneuver").path("modifier").asText("").trim();
                    String instruction = formatInstruction(type, modifier, name);
                    if (!instruction.isBlank()) directions.add(instruction);
                }
            }
            return new RouteResult(route.path("distance").asDouble(),
                    Math.round(route.path("duration").asDouble()), directions);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String formatInstruction(String type, String modifier, String road) {
        if (type.isBlank()) return "";
        String action = switch (type.toLowerCase(Locale.ROOT)) {
            case "depart" -> "Start";
            case "arrive" -> "Arrive at your destination";
            case "turn" -> "Turn";
            case "fork" -> "Keep";
            case "roundabout", "rotary" -> "Enter the roundabout";
            case "merge" -> "Merge";
            case "on_ramp" -> "Take the ramp";
            case "off_ramp" -> "Take the exit";
            default -> type.replace('_', ' ');
        };
        String detail = modifier.isBlank() ? "" : " " + modifier;
        return road.isBlank() ? action + detail : action + detail + " onto " + road;
    }

    public record RouteResult(double distanceMeters, long durationSeconds, List<String> directions) {
    }
}
