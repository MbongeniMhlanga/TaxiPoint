package za.co.taxipoint.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncidentDto {
    private Long id;
    private String description;
    private String reporter;
    private double latitude;
    private double longitude;
    private String formattedAddress;
    private LocalDateTime createdAt;
}