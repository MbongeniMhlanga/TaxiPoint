package za.co.taxipoint.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Data
@Entity
@Table(name = "correction_submissions")
public class CorrectionSubmission {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(columnDefinition = "uuid")
    private UUID rankId;

    @Column(length = 150)
    private String rankNameSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CorrectionType correctionType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> details = new LinkedHashMap<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CorrectionStatus status = CorrectionStatus.PENDING;

    @Column(nullable = false)
    private int confirmationsCount = 0;

    @Column(nullable = false)
    private int rejectionsCount = 0;

    @Column(nullable = false)
    private boolean autoApproved = false;

    @Column(name = "submitted_by_user_id")
    private Long submittedByUserId;

    @Column(name = "submitted_by_email", length = 100)
    private String submittedByEmail;

    @Column(name = "submitted_by_name", length = 150)
    private String submittedByName;

    @Column(name = "reviewed_by_user_id")
    private Long reviewedByUserId;

    @Column(name = "reviewed_by_email", length = 100)
    private String reviewedByEmail;

    @Column(columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

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
