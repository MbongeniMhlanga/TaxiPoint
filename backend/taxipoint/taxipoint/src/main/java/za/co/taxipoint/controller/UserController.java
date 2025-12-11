package za.co.taxipoint.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.taxipoint.dto.UserDTO;
import za.co.taxipoint.dto.UserLoginDTO;
import za.co.taxipoint.dto.UserRegisterDTO;
import za.co.taxipoint.dto.UserUpdateDTO;
import za.co.taxipoint.service.UserService;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = {
    "https://taxi-point.vercel.app",
    "http://localhost:*",
    "http://localhost:3000",
    "http://localhost:8081",
    "http://10.0.2.2:*"
})
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
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginDTO dto) {
        try {
            var authResp = userService.loginUser(dto);
            return ResponseEntity.ok(authResp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Login failed: " + e.getMessage());
        }
    }
    @GetMapping
    public ResponseEntity<List<UserDTO>> listUsers() {
        return ResponseEntity.ok(userService.listUsers());
    }

@PatchMapping("/{id}")
public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UserUpdateDTO dto) {
    try {
        UserDTO updatedUser = userService.updateUser(id, dto);
        return ResponseEntity.ok(updatedUser);
    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    } catch (Exception e) {
        return ResponseEntity.status(500).body(Map.of("message", "Update failed: " + e.getMessage()));
    }
}


@PatchMapping("/{id}/password")
public ResponseEntity<?> updatePassword(
        @PathVariable Long id,
        @RequestBody Map<String, String> body
) {
    try {
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        userService.updatePassword(id, oldPassword, newPassword);
        return ResponseEntity.ok("Password updated successfully");
    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}


    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
}
