package za.co.taxipoint.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.taxipoint.dto.IncidentRequest;
import za.co.taxipoint.model.Incident;
import za.co.taxipoint.repository.IncidentRepository; // Import the repository
import za.co.taxipoint.service.IncidentService;

import java.util.List; // Import List

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;
    private final IncidentRepository incidentRepository; // Inject the repository

    @GetMapping // New method to handle GET requests
    public ResponseEntity<List<Incident>> getAllIncidents() {
        List<Incident> incidents = incidentRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(incidents);
    }

    @PostMapping
    public ResponseEntity<Incident> createIncident(@RequestBody IncidentRequest request) {
        Incident saved = incidentService.createIncident(
                request.getDescription(),
                request.getReporter(),
                request.getLatitude(),
                request.getLongitude()
        );
        return ResponseEntity.ok(saved);
    }
}