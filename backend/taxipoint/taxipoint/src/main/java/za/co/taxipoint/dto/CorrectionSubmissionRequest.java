package za.co.taxipoint.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import za.co.taxipoint.model.CorrectionType;

import java.util.Map;
import java.util.UUID;

@Data
public class CorrectionSubmissionRequest {
    private UUID rankId;
    private String rankNameSnapshot;

    @NotNull
    private CorrectionType correctionType;

    @NotBlank
    private String description;

    private Map<String, Object> details;
}
