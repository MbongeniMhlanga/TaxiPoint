package za.co.taxipoint.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import za.co.taxipoint.model.Incident;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findAllByOrderByCreatedAtDesc();

    /**
     * Count unresolved incidents
     * Assumes you have a 'resolved' boolean field in Incident model
     */
    long countByResolvedFalse();
}