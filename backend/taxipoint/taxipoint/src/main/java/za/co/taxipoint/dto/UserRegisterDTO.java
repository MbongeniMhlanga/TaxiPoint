package za.co.taxipoint.dto;

import lombok.Data;

@Data
public class UserRegisterDTO {
    private String name;
    private String surname;
    private String email;
    private String password;
}
