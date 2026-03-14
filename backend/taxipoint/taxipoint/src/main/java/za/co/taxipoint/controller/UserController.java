package za.co.taxipoint.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import za.co.taxipoint.dto.UserDTO;
import za.co.taxipoint.dto.UserLoginDTO;
import za.co.taxipoint.dto.UserRegisterDTO;
import za.co.taxipoint.dto.UserUpdateDTO;
import za.co.taxipoint.dto.ForgotPasswordRequest;
import za.co.taxipoint.dto.ResetPasswordRequest;
import za.co.taxipoint.service.UserService;
import za.co.taxipoint.service.PasswordResetService;
import za.co.taxipoint.service.RateLimitingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final PasswordResetService passwordResetService;
    private final RateLimitingService rateLimitingService;
    private final HttpServletRequest request;
    
    public UserController(UserService userService, 
                          PasswordResetService passwordResetService,
                          RateLimitingService rateLimitingService,
                          HttpServletRequest request) {
        this.userService = userService;
        this.passwordResetService = passwordResetService;
        this.rateLimitingService = rateLimitingService;
        this.request = request;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegisterDTO dto) {
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
        // Rate Limiting Check
        String clientIp = request.getRemoteAddr();
        if (!rateLimitingService.resolveBucket(clientIp).tryConsume(1)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body("Too many login attempts. Please try again later.");
        }

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

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest requestDto) {
        // Rate Limiting Check
        String clientIp = request.getRemoteAddr();
        if (!rateLimitingService.resolveBucket(clientIp).tryConsume(1)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body("Too many password reset requests. Please try again later.");
        }

        try {
            passwordResetService.requestPasswordReset(requestDto);
            return ResponseEntity.ok("Password reset email sent successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to process password reset request: " + e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest requestDto) {
        // Rate Limiting Check
        String clientIp = request.getRemoteAddr();
        if (!rateLimitingService.resolveBucket(clientIp).tryConsume(1)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body("Too many attempts. Please try again later.");
        }

        try {
            passwordResetService.resetPassword(requestDto);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An unexpected error occurred"));
        }
    }

    @GetMapping("/reset-password/validate")
    public ResponseEntity<?> validateResetToken(@RequestParam String token) {
        try {
            boolean isValid = passwordResetService.isTokenValid(token);
            if (isValid) {
                return ResponseEntity.ok(Map.of("valid", true, "message", "Token is valid"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "Invalid or expired token"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("valid", false, "error", "Token validation failed"));
        }
    }
}
