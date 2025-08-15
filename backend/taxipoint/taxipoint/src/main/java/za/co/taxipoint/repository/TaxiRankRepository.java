package za.co.taxipoint.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import za.co.taxipoint.model.TaxiRank;

import java.util.List;
import java.util.UUID;

public interface TaxiRankRepository extends JpaRepository<TaxiRank, UUID> {

    Page<TaxiRank> findByDistrictIgnoreCaseContaining(String district, Pageable pageable);

    @Query("SELECT t FROM TaxiRank t WHERE LOWER(t.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(t.address) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<TaxiRank> searchByNameOrAddress(String query);

    // Corrected method with distance calculation
    @Query(value = """
            SELECT *, ST_Distance(
                CAST(location AS geography),
                CAST(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) AS geography)
            ) as distance_meters
            FROM taxi_ranks
            WHERE ST_DWithin(
                CAST(location AS geography),
                CAST(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) AS geography),
                :radius
            )
            ORDER BY distance_meters
            """, nativeQuery = true)
    List<TaxiRank> findNearbyWithDistance(
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("radius") Double radius
    );

    // Corrected method without distance calculation
    @Query(value = """
            SELECT * FROM taxi_ranks
            WHERE ST_DWithin(
                CAST(location AS geography),
                CAST(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) AS geography),
                :radius
            )
    """, nativeQuery = true)
    List<TaxiRank> findNearby(
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("radius") Double radius
    );

    @Query("SELECT t FROM TaxiRank t WHERE LOWER(t.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(t.address) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(CAST(t.routesServed as string)) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(t.district) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<TaxiRank> searchByNameOrAddressOrRoutesOrDistrict(@Param("query") String query);
}
