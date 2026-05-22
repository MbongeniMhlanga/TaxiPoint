package za.co.taxipoint.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import za.co.taxipoint.model.ReviewDecision;

@Data
public class CorrectionReviewRequest {
    @NotNull
    private ReviewDecision decision;

    private String reviewNotes;
}
