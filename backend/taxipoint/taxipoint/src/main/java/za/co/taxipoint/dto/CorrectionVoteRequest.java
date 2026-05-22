package za.co.taxipoint.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import za.co.taxipoint.model.CorrectionVoteType;

@Data
public class CorrectionVoteRequest {
    @NotNull
    private CorrectionVoteType voteType;
}
