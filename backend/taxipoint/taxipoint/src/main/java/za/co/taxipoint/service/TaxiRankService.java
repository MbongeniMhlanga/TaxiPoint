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
    return taxiRankRepository.searchByNameOrAddressOrRoutesOrDistrict(query);
}




    public List<TaxiRank> findNearby(Double lat, Double lng, Double radiusMeters) {
        // The repository now handles the sorting, so we can just call this method.
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
        rank.setName(dto.getName());
        rank.setAddress(dto.getAddress());
        rank.setDescription(dto.getDescription());
        rank.setDistrict(dto.getDistrict());
        rank.setPhone(dto.getPhone());

        // Update routesServed safely
        if (dto.getRoutesServed() != null) {
            rank.setRoutesServed(dto.getRoutesServed());
        }

        // Update hours safely
        if (dto.getHours() != null) {
            rank.setHours(dto.getHours());
        }

        // Update facilities safely
        if (dto.getFacilities() != null) {
            rank.setFacilities(dto.getFacilities());
        }

        // Update location if latitude & longitude are provided
        if (dto.getLatitude() != null && dto.getLongitude() != null) {
            Point location = geometryFactory.createPoint(new Coordinate(dto.getLongitude(), dto.getLatitude()));
            location.setSRID(4326);
            rank.setLocation(location);
        }

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
        dto.setId(rank.getId().toString()); // <-- This is the key line added to your code
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

    // Inside TaxiRankService
private double distance(double lat1, double lon1, double lat2, double lon2) {
    final int R = 6371000; // Earth radius in meters
    double latRad1 = Math.toRadians(lat1);
    double latRad2 = Math.toRadians(lat2);
    double deltaLat = Math.toRadians(lat2 - lat1);
    double deltaLon = Math.toRadians(lon2 - lon1);

    double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
               Math.cos(latRad1) * Math.cos(latRad2) *
               Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}


    public List<TaxiRankDTO> findNearbyWithDistance(Double lat, Double lng, Double radiusMeters) {
    // Call repository method that fetches all within radius
    List<TaxiRank> nearbyRanks = taxiRankRepository.findNearby(lat, lng, radiusMeters);

    // Map to DTO and calculate distance
    return nearbyRanks.stream()
            .map(rank -> {
                TaxiRankDTO dto = toDTO(rank);
                if (dto.getLatitude() != null && dto.getLongitude() != null) {
                    double dist = distance(lat, lng, dto.getLatitude(), dto.getLongitude());
                    dto.setDistanceMeters(dist);
                }
                return dto;
            })
            .sorted((r1, r2) -> Double.compare(r1.getDistanceMeters(), r2.getDistanceMeters()))
            .toList();
}

}
