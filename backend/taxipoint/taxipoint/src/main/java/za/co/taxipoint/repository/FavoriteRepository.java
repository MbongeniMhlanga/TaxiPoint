package za.co.taxipoint.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.co.taxipoint.model.Favorite;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Favorite> findByUserIdAndTaxiRankId(Long userId, UUID taxiRankId);
    boolean existsByUserIdAndTaxiRankId(Long userId, UUID taxiRankId);
}
