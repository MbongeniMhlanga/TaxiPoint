package za.co.taxipoint.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.taxipoint.model.CorrectionVote;
import za.co.taxipoint.model.CorrectionVoteType;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CorrectionVoteRepository extends JpaRepository<CorrectionVote, UUID> {
    Optional<CorrectionVote> findBySubmissionIdAndVoterUserId(UUID submissionId, Long voterUserId);
    long countBySubmissionIdAndVoteType(UUID submissionId, CorrectionVoteType voteType);
}
