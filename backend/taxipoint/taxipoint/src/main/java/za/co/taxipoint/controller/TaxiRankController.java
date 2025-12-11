package za.co.taxipoint.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.taxipoint.dto.TaxiRankDTO;
import za.co.taxipoint.model.TaxiRank;
import za.co.taxipoint.service.TaxiRankService;

import java.net.URI;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@CrossOrigin(origins = {
    "https://taxi-point.vercel.app",
    "http://localhost:*",
    "http://localhost:3000",
    "http://localhost:8081",
    "http://10.0.2.2:*"
})
@RequestMapping("/api")
public class TaxiRankController {

    @Autowired
    private TaxiRankService taxiRankService;

    // List taxi ranks with optional suburb filter or nearby geo query
    @GetMapping("/taxi-ranks")
    public ResponseEntity<Page<TaxiRankDTO>> listTaxiRanks(
            @RequestParam Optional<String> suburb,
            @RequestParam Optional<Double> lat,
            @RequestParam Optional<Double> lng,
            @RequestParam Optional<Double> radius_m,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);

        // Geo query has priority if lat, lng, radius are present
        if (lat.isPresent() && lng.isPresent() && radius_m.isPresent()) {
            List<TaxiRank> nearby = taxiRankService.findNearby(lat.get(), lng.get(), radius_m.get());

            // Paginate manually
            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), nearby.size());

            Page<TaxiRankDTO> pageResult = new PageImpl<>(
                    nearby.subList(start, end)
                            .stream()
                            .map(taxiRankService::toDTO)
                            .toList(),
                    pageable,
                    nearby.size()
            );

            return ResponseEntity.ok(pageResult);
        }

        // Standard list with optional suburb filter
        Page<TaxiRank> ranks = taxiRankService.listTaxiRanks(suburb, page, size);
        Page<TaxiRankDTO> dtoPage = ranks.map(taxiRankService::toDTO);
        return ResponseEntity.ok(dtoPage);
    }

    // Get a single taxi rank by ID
    @GetMapping("/taxi-ranks/{id}")
    public ResponseEntity<TaxiRankDTO> getTaxiRank(@PathVariable UUID id) {
        return taxiRankService.getById(id)
                .map(taxiRankService::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Create a new taxi rank
    @PostMapping("/taxi-ranks")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaxiRankDTO> createTaxiRank(@Valid @RequestBody TaxiRankDTO dto) {
        TaxiRank saved = taxiRankService.createTaxiRank(taxiRankService.fromDTO(dto));
        return ResponseEntity.created(URI.create("/api/taxi-ranks/" + saved.getId()))
                .body(taxiRankService.toDTO(saved));
    }

    // Update an existing taxi rank
    @PutMapping("/taxi-ranks/{id}")
    //@PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TaxiRankDTO> updateTaxiRank(@PathVariable UUID id, @Valid @RequestBody TaxiRankDTO dto) {
        try {
            TaxiRank updated = taxiRankService.updateTaxiRank(id, dto); // Pass DTO directly
            return ResponseEntity.ok(taxiRankService.toDTO(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }


    // Search taxi ranks by text query (name, route, district)
    @GetMapping("/taxi-ranks/search")
    public ResponseEntity<List<TaxiRankDTO>> searchTaxiRanks(@RequestParam String query) {
        List<TaxiRankDTO> results = taxiRankService.searchByText(query)
                .stream()
                .map(taxiRankService::toDTO)
                .toList();
        return ResponseEntity.ok(results);
    }

   @GetMapping("/taxi-ranks/nearby")
public ResponseEntity<List<TaxiRankDTO>> getNearbyTaxiRanks(
        @RequestParam double lat,
        @RequestParam double lng,
        @RequestParam(defaultValue = "5000") double radius_m
) {
    try {
        List<TaxiRankDTO> nearby = taxiRankService.findNearbyWithDistance(lat, lng, radius_m);

        return ResponseEntity.ok(nearby);

    } catch (Exception e) {
        return ResponseEntity.status(500).body(Collections.emptyList());
    }
}

}