package za.co.taxipoint.dto;

import lombok.Data;

@Data
public class UserUpdateDTO {
    private String name;
    private String surname;
    private String email;
    private String password; // optional, only set if changing password
    private Boolean notifications;
    private Boolean soundAlerts;
    private Boolean autoRefresh;
    private Boolean locationSharing;
    private Boolean darkMode;
}
