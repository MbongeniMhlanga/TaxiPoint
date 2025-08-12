package za.co.taxipoint.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.taxipoint.dto.TaxiRankDTO;
import za.co.taxipoint.model.TaxiRank;
import za.co.taxipoint.service.TaxiRankService;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class TaxiRankController {

  @Autowired
  private TaxiRankService taxiRankService;

  @GetMapping("/taxi-ranks")
  public ResponseEntity<Page<TaxiRank>> listTaxiRanks(
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
      int end = Math.min((start + pageable.getPageSize()), nearby.size());

      Page<TaxiRank> pageResult = new PageImpl<>(nearby.subList(start, end), pageable, nearby.size());
      return ResponseEntity.ok(pageResult);
    }

    Page<TaxiRank> ranks = taxiRankService.listTaxiRanks(suburb, page, size);
    return ResponseEntity.ok(ranks);
  }

  @GetMapping("/taxi-ranks/{id}")
  public ResponseEntity<TaxiRank> getTaxiRank(@PathVariable UUID id) {
    return taxiRankService.getById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @PostMapping("/taxi-ranks")
  //@PreAuthorize("hasRole('ADMIN')") // uncomment when security configured
  public ResponseEntity<TaxiRank> createTaxiRank(@Valid @RequestBody TaxiRankDTO dto) {
    TaxiRank taxiRank = mapDtoToEntity(dto);
    TaxiRank saved = taxiRankService.createTaxiRank(taxiRank);
    return ResponseEntity.created(URI.create("/api/taxi-ranks/" + saved.getId())).body(saved);
  }

  @PutMapping("/taxi-ranks/{id}")
  //@PreAuthorize("hasRole('ADMIN')") // uncomment when security configured
  public ResponseEntity<TaxiRank> updateTaxiRank(@PathVariable UUID id, @Valid @RequestBody TaxiRankDTO dto) {
    TaxiRank taxiRank = mapDtoToEntity(dto);
    try {
      TaxiRank updated = taxiRankService.updateTaxiRank(id, taxiRank);
      return ResponseEntity.ok(updated);
    } catch (RuntimeException e) {
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping("/search")
  public ResponseEntity<List<TaxiRank>> searchTaxiRanks(@RequestParam String q) {
    List<TaxiRank> results = taxiRankService.searchByText(q);
    return ResponseEntity.ok(results);
  }

  private TaxiRank mapDtoToEntity(TaxiRankDTO dto) {
    TaxiRank t = new TaxiRank();
    t.setName(dto.getName());
    t.setDescription(dto.getDescription());
    t.setAddress(dto.getAddress());
    t.setLatitude(dto.getLatitude());
    t.setLongitude(dto.getLongitude());
    t.setDistrict(dto.getDistrict());
    t.setRoutesServed(dto.getRoutesServed());
    t.setHours(dto.getHours());
    t.setPhone(dto.getPhone());
    t.setFacilities(dto.getFacilities());
    return t;
  }
}
