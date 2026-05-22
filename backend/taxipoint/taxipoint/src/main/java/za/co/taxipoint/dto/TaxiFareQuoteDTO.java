package za.co.taxipoint.dto;

import lombok.Data;

@Data
public class TaxiFareQuoteDTO {
    private String rankId;
    private String rankName;
    private String requestedDestination;
    private String matchedDestination;
    private Double fare;
    private String currency;
}
