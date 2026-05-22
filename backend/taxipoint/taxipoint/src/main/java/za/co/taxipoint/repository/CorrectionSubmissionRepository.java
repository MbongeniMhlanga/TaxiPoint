package za.co.taxipoint.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.taxipoint.model.CorrectionStatus;
import za.co.taxipoint.model.CorrectionSubmission;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface CorrectionSubmissionRepository extends JpaRepository<CorrectionSubmission, UUID> {
    List<CorrectionSubmission> findByStatusInOrderByCreatedAtDesc(Collection<CorrectionStatus> statuses);
    List<CorrectionSubmission> findByRankIdOrderByCreatedAtDesc(UUID rankId);
}
