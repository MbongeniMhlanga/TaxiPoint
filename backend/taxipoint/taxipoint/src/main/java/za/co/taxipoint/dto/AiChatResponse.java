package za.co.taxipoint.dto;

import java.util.List;

public record AiChatResponse(String reply, List<AiTripOption> tripOptions, AiTripPlan tripPlan) {
}
