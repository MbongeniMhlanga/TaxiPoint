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
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;
    private final IncidentRepository incidentRepository;
    private final GeocodingService geocodingService;

    @GetMapping
    public ResponseEntity<List<IncidentDto>> getAllIncidents(
            @RequestParam(defaultValue = "false") boolean includeResolved
    ) {
        incidentService.autoResolveExpiredIncidents();
        List<Incident> incidents = includeResolved
                ? incidentRepository.findAllByOrderByCreatedAtDesc()
                : incidentRepository.findByResolvedFalseOrderByCreatedAtDesc();

        List<IncidentDto> incidentDtos = incidents.stream()
                .map(this::toDto)
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

    @PutMapping("/{id}/resolved")
    public ResponseEntity<IncidentDto> updateResolvedStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body
    ) {
        Boolean resolved = body.get("resolved");
        if (resolved == null) {
            return ResponseEntity.badRequest().build();
        }

        return incidentRepository.findById(id)
                .map(incident -> {
                    incident.setResolved(resolved);
                    Incident saved = incidentRepository.save(incident);
                    return ResponseEntity.ok(toDto(saved));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private IncidentDto toDto(Incident incident) {
        double latitude = 0.0;
        double longitude = 0.0;
        String formattedAddress = "Location not available";

        if (incident.getLocation() != null) {
            latitude = incident.getLocation().getY();
            longitude = incident.getLocation().getX();
            formattedAddress = geocodingService.reverseGeocode(latitude, longitude);
        }

        return new IncidentDto(
                incident.getId(),
                incident.getDescription(),
                incident.getReporter(),
                latitude,
                longitude,
                formattedAddress,
                incident.getCreatedAt(),
                Boolean.TRUE.equals(incident.getResolved())
        );
    }
}
