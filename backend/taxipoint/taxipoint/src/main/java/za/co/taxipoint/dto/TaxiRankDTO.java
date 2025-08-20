package za.co.taxipoint.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class TaxiRankDTO {
    private String id;
    private String name;
    private String description;
    private String address;
    private Double latitude;   // input/output for API
    private Double longitude;  // input/output for API
    private String district;
    private List<String> routesServed;
    private Map<String, String> hours;      // e.g. {"Mon-Fri": "6am-10pm"}
    private String phone;
    private Map<String, Object> facilities; // e.g. {"toilets": true}
       private Double distanceMeters;
}
