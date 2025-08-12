package za.co.taxipoint.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.taxipoint.dto.UserDTO;
import za.co.taxipoint.dto.UserLoginDTO;
import za.co.taxipoint.dto.UserRegisterDTO;
import za.co.taxipoint.service.UserService;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegisterDTO dto) {
        try {
            UserDTO createdUser = userService.registerUser(dto);
            return ResponseEntity.ok(createdUser);
        } catch (IllegalArgumentException e) {
            // for validation errors
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            // for other unexpected errors
            return ResponseEntity.status(500).body("Registration failed: " + e.getMessage());
        }
    }
    
// za.co.taxipoint.controller.UserController (excerpt)
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody UserLoginDTO dto) {
    var authResp = userService.loginUser(dto); // returns AuthResponse
    return ResponseEntity.ok(authResp);
}

    
    @GetMapping
    public ResponseEntity<List<UserDTO>> listUsers() {
        return ResponseEntity.ok(userService.listUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
}
