package za.co.taxipoint.dto;

import lombok.Data;
import za.co.taxipoint.model.CorrectionStatus;
import za.co.taxipoint.model.CorrectionType;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
public class CorrectionSubmissionDTO {
    private UUID id;
    private UUID rankId;
    private String rankNameSnapshot;
    private CorrectionType correctionType;
    private String description;
    private Map<String, Object> details;
    private CorrectionStatus status;
    private int confirmationsCount;
    private int rejectionsCount;
    private boolean autoApproved;
    private Long submittedByUserId;
    private String submittedByEmail;
    private String submittedByName;
    private Long reviewedByUserId;
    private String reviewedByEmail;
    private String reviewNotes;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
