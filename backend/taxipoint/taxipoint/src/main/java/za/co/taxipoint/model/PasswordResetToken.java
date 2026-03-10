package za.co.taxipoint.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;
import lombok.Data;

@Data
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    @Column(nullable = false)
    private boolean used = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.token = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now(ZoneId.of("GMT+2"));
        this.updatedAt = LocalDateTime.now(ZoneId.of("GMT+2"));
        this.expiryDate = LocalDateTime.now(ZoneId.of("GMT+2")).plusMinutes(5); // OTP expires in 5 minutes
        this.used = false; // Ensure token starts as unused
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now(ZoneId.of("GMT+2"));
    }

    public boolean isExpired() {
        return LocalDateTime.now(ZoneId.of("GMT+2")).isAfter(expiryDate);
    }

    public boolean isUsed() {
        return used;
    }
}
