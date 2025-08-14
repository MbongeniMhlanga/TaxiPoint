package za.co.taxipoint.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import za.co.taxipoint.model.TaxiRank;

import java.util.List;
import java.util.UUID;

public interface TaxiRankRepository extends JpaRepository<TaxiRank, UUID> {

    Page<TaxiRank> findByDistrictIgnoreCaseContaining(String district, Pageable pageable);

    @Query("SELECT t FROM TaxiRank t WHERE LOWER(t.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(t.address) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<TaxiRank> searchByNameOrAddress(String query);

    // PostGIS Nearby Query
    @Query(value = "SELECT * FROM taxi_ranks " +
            "WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(?2, ?1), 4326)::geography, ?3)", 
            nativeQuery = true)
    List<TaxiRank> findNearby(Double lat, Double lng, Double radiusMeters);
}
