package za.co.taxipoint.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import za.co.taxipoint.dto.AiChatMessage;
import za.co.taxipoint.dto.AiChatRequest;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiAssistantService {

    private static final int MAX_MESSAGE_LENGTH = 2000;
    private static final int MAX_HISTORY_MESSAGES = 12;

    private final RestTemplate restTemplate = new RestTemplate();
    private final String apiKey;
    private final String model;
    private final String endpoint;

    public GeminiAssistantService(
            @Value("${GEMINI_API_KEY:}") String apiKey,
            @Value("${GEMINI_MODEL:gemini-2.5-flash}") String model,
            @Value("${GEMINI_API_URL:https://generativelanguage.googleapis.com/v1beta}") String apiUrl
    ) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.endpoint = apiUrl.replaceAll("/$", "") + "/models/" + model + ":generateContent";
    }

    public String chat(AiChatRequest request) {
        String message = request == null ? "" : request.message();
        if (message == null || message.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message is required.");
        }
        if (message.length() > MAX_MESSAGE_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message is too long.");
        }
        if (apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI assistant is not configured yet.");
        }

        List<Map<String, Object>> contents = new ArrayList<>();
        List<AiChatMessage> history = request.history() == null ? List.of() : request.history();
        int start = Math.max(0, history.size() - MAX_HISTORY_MESSAGES);

        for (AiChatMessage item : history.subList(start, history.size())) {
            if (item == null || item.content() == null || item.content().isBlank()) continue;
            String role = "assistant".equalsIgnoreCase(item.role()) ? "model" : "user";
            contents.add(content(role, item.content().substring(0, Math.min(item.content().length(), MAX_MESSAGE_LENGTH))));
        }

        // The frontend sends the current question in history. Avoid duplicating it.
        if (contents.isEmpty() || !message.equals(lastText(contents))) {
            contents.add(content("user", message));
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("systemInstruction", content("system", "You are Will, TaxiPoint's friendly commuter assistant. Help users with taxi ranks, routes, fares, operating hours, incidents, delays, and how to use TaxiPoint. Be concise and practical. Do not invent live transport information. If data is unavailable, say so clearly."));
        payload.put("contents", contents);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(endpoint, HttpMethod.POST, new HttpEntity<>(payload, headers), Map.class);
            String text = extractText(response.getBody());
            if (text == null || text.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini returned an empty response.");
            }
            return text;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "The AI assistant is temporarily unavailable.", exception);
        }
    }

    private Map<String, Object> content(String role, String text) {
        return Map.of("role", role, "parts", List.of(Map.of("text", text)));
    }

    private String lastText(List<Map<String, Object>> contents) {
        Map<String, Object> last = contents.get(contents.size() - 1);
        List<Map<String, String>> parts = (List<Map<String, String>>) last.get("parts");
        return parts.get(0).get("text");
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map response) {
        if (response == null) return null;
        List<Map> candidates = (List<Map>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) return null;
        Map content = (Map) candidates.get(0).get("content");
        if (content == null) return null;
        List<Map> parts = (List<Map>) content.get("parts");
        if (parts == null || parts.isEmpty()) return null;
        Object text = parts.get(0).get("text");
        return text == null ? null : text.toString();
    }
}
