package za.co.taxipoint.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.taxipoint.dto.IncidentDto;
import za.co.taxipoint.dto.IncidentRequest;
import za.co.taxipoint.model.Incident;
import za.co.taxipoint.repository.IncidentRepository;
import za.co.taxipoint.service.GeocodingService;
import za.co.taxipoint.service.IncidentService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;
    private final IncidentRepository incidentRepository;
    private final GeocodingService geocodingService;

    @GetMapping
    public ResponseEntity<List<IncidentDto>> getAllIncidents() {
        List<Incident> incidents = incidentRepository.findAllByOrderByCreatedAtDesc();
        List<IncidentDto> incidentDtos = incidents.stream()
                .map(incident -> {
                    // Check if location is not null before processing
                    if (incident.getLocation() != null) {
                        return new IncidentDto(
                                incident.getId(),
                                incident.getDescription(),
                                incident.getReporter(),
                                incident.getLocation().getY(), // Latitude
                                incident.getLocation().getX(), // Longitude
                                geocodingService.reverseGeocode(incident.getLocation().getY(), incident.getLocation().getX()),
                                incident.getCreatedAt()
                        );
                    } else {
                        // Handle the case where location is null, returning a default DTO
                        return new IncidentDto(
                                incident.getId(),
                                incident.getDescription(),
                                incident.getReporter(),
                                0.0, // Default latitude
                                0.0, // Default longitude
                                "Location not available",
                                incident.getCreatedAt()
                        );
                    }
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(incidentDtos);
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