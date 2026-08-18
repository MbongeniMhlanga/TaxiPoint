package za.co.taxipoint.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.taxipoint.dto.AiChatRequest;
import za.co.taxipoint.service.GeminiAssistantService;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAssistantController {

    private final GeminiAssistantService assistantService;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody AiChatRequest request) {
        return ResponseEntity.ok(Map.of("reply", assistantService.chat(request)));
    }
}
