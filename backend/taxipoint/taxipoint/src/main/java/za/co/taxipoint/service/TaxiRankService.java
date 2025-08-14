package za.co.taxipoint.service;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import za.co.taxipoint.dto.TaxiRankDTO;
import za.co.taxipoint.model.TaxiRank;
import za.co.taxipoint.repository.TaxiRankRepository;
import org.locationtech.jts.geom.Point;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TaxiRankService {

    @Autowired
    private TaxiRankRepository taxiRankRepository;
     private final GeometryFactory geometryFactory = new GeometryFactory();

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

   public TaxiRank updateTaxiRank(UUID id, TaxiRankDTO dto) {
    return taxiRankRepository.findById(id).map(rank -> {
        TaxiRank updatedRank = fromDTO(dto);
        rank.setName(updatedRank.getName());
        rank.setAddress(updatedRank.getAddress());
        rank.setDescription(updatedRank.getDescription());
        rank.setLocation(updatedRank.getLocation());
        rank.setDistrict(updatedRank.getDistrict());
        rank.setRoutesServed(updatedRank.getRoutesServed());
        rank.setHours(updatedRank.getHours());
        rank.setPhone(updatedRank.getPhone());
        rank.setFacilities(updatedRank.getFacilities());
        return taxiRankRepository.save(rank);
    }).orElseThrow(() -> new RuntimeException("TaxiRank not found"));
}
     

    // Convert DTO to Entity
    public TaxiRank fromDTO(TaxiRankDTO dto) {
        TaxiRank rank = new TaxiRank();
        rank.setName(dto.getName());
        rank.setDescription(dto.getDescription());
        rank.setAddress(dto.getAddress());
        rank.setDistrict(dto.getDistrict());
        rank.setRoutesServed(dto.getRoutesServed());
        rank.setHours(dto.getHours());
        rank.setPhone(dto.getPhone());
        rank.setFacilities(dto.getFacilities());

        if (dto.getLatitude() != null && dto.getLongitude() != null) {
            Point location = geometryFactory.createPoint(new Coordinate(dto.getLongitude(), dto.getLatitude()));
            location.setSRID(4326);
            rank.setLocation(location);
        }

        return rank;
    }

    // Convert Entity to DTO
    public TaxiRankDTO toDTO(TaxiRank rank) {
        TaxiRankDTO dto = new TaxiRankDTO();
        dto.setName(rank.getName());
        dto.setDescription(rank.getDescription());
        dto.setAddress(rank.getAddress());
        dto.setDistrict(rank.getDistrict());
        dto.setRoutesServed(rank.getRoutesServed());
        dto.setHours(rank.getHours());
        dto.setPhone(rank.getPhone());
        dto.setFacilities(rank.getFacilities());

        if (rank.getLocation() != null) {
            dto.setLatitude(rank.getLocation().getY());
            dto.setLongitude(rank.getLocation().getX());
        }

        return dto;
    }
}
