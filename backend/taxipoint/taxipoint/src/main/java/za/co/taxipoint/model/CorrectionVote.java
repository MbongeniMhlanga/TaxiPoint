package za.co.taxipoint.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(
        name = "correction_votes",
        uniqueConstraints = @UniqueConstraint(name = "uk_correction_vote_submission_voter", columnNames = {"submission_id", "voter_user_id"})
)
public class CorrectionVote {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "submission_id", columnDefinition = "uuid", nullable = false)
    private UUID submissionId;

    @Column(name = "voter_user_id", nullable = false)
    private Long voterUserId;

    @Column(name = "voter_email", nullable = false, length = 100)
    private String voterEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CorrectionVoteType voteType;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
