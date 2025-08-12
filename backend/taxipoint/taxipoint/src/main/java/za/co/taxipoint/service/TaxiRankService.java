package za.co.taxipoint.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import za.co.taxipoint.dto.TaxiRankDTO;
import za.co.taxipoint.model.TaxiRank;
import za.co.taxipoint.repository.TaxiRankRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TaxiRankService {

  @Autowired
  private TaxiRankRepository taxiRankRepository;

  public Page<TaxiRank> listTaxiRanks(Optional<String> district, int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
    if (district.isPresent()) {
      return taxiRankRepository.findByDistrictIgnoreCaseContaining(district.get(), pageable);
    }
    return taxiRankRepository.findAll(pageable);
  }

  public List<TaxiRank> searchByText(String query) {
    return taxiRankRepository.searchByNameOrAddress(query);
  }

  public List<TaxiRank> findNearby(Double lat, Double lng, Double radiusMeters) {
    return taxiRankRepository.findNearby(lat, lng, radiusMeters);
  }

  public Optional<TaxiRank> getById(UUID id) {
    return taxiRankRepository.findById(id);
  }

  public TaxiRank createTaxiRank(TaxiRank taxiRank) {
    return taxiRankRepository.save(taxiRank);
  }

  public TaxiRank updateTaxiRank(UUID id, TaxiRank updatedRank) {
    return taxiRankRepository.findById(id).map(rank -> {
      rank.setName(updatedRank.getName());
      rank.setAddress(updatedRank.getAddress());
      rank.setDescription(updatedRank.getDescription());
      rank.setLatitude(updatedRank.getLatitude());
      rank.setLongitude(updatedRank.getLongitude());
      rank.setDistrict(updatedRank.getDistrict());
      rank.setRoutesServed(updatedRank.getRoutesServed());
      rank.setHours(updatedRank.getHours());
      rank.setPhone(updatedRank.getPhone());
      rank.setFacilities(updatedRank.getFacilities());
      return taxiRankRepository.save(rank);
    }).orElseThrow(() -> new RuntimeException("TaxiRank not found"));
  }
}
