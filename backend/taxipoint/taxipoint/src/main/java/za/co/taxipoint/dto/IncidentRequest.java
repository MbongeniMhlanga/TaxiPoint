package za.co.taxipoint.dto;

import lombok.Data;

@Data
public class IncidentRequest {
    private String description;
    private String reporter;
    private double latitude;
    private double longitude;
}
