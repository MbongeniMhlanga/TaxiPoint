package za.co.taxipoint.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data // <-- Lombok annotation to generate getters, setters, equals, hashCode, toString
@Entity
@Table(name = "taxi_ranks")
public class TaxiRank {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String address;

    @Column
    private Double latitude;
    
    @Column
    private Double longitude;
    
    @Column(length = 100)
    private String district;

    // Use JdbcTypeCode for direct JSON to jsonb mapping
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> routesServed;

    // Use a Map for hours as it's a key-value pair
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> hours;

    @Column(length = 20)
    private String phone;

    // Use a Map for facilities
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> facilities;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
