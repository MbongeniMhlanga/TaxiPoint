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

  // Text search by name or address (Postgres full text search is better, but simple LIKE for example)
  @Query("SELECT t FROM TaxiRank t WHERE LOWER(t.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(t.address) LIKE LOWER(CONCAT('%', :query, '%'))")
  List<TaxiRank> searchByNameOrAddress(String query);

  // Geo query: crude example, real geo search needs PostGIS or haversine formula
  @Query(value = "SELECT * FROM taxi_ranks t WHERE earth_box(ll_to_earth(?1, ?2), ?3) @> ll_to_earth(t.latitude, t.longitude)", nativeQuery = true)
  List<TaxiRank> findNearby(Double lat, Double lng, Double radiusMeters);
}
