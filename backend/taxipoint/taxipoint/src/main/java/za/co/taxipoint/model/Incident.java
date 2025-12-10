package za.co.taxipoint.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.locationtech.jts.geom.Point;

/**
 * Represents an incident reported by a user.
 * This class uses Lombok for boilerplate code and a JTS Point for location.
 * Added a fix for a common Jackson serialization issue with JTS Point objects.
 */
@Entity
@Table(name = "incidents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String reporter;

    /**
     * The JTS Point object for the location.
     * We use @JsonIgnore to prevent Jackson from serializing this complex object,
     * which would cause a StackOverflowError. Instead, we provide a custom
     * getter for JSON serialization.
     */
    @JsonIgnore
    @Column(columnDefinition = "geometry(Point,4326)", nullable = false)
    private Point location;

    // The correct fix: We use the @CreationTimestamp annotation.
    // While LocalDateTime.now() is a good default in Java, the @CreationTimestamp
    // annotation is the idiomatic JPA/Hibernate way to ensure the database
    // sets the timestamp upon creation, which is more reliable.
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
 * Tracks whether the incident has been resolved.
 * Defaults to false (unresolved) when a new incident is created.
 */
@Builder.Default
@Column(name = "resolved", nullable = false)
private Boolean resolved = false;

    /**
     * Custom getter to provide a serializable representation of the Point location.
     * Jackson will use this method to create a simple JSON object for the location,
     * avoiding the StackOverflowError.
     *
     * @return a Map containing the latitude and longitude.
     */
    @JsonProperty("location")
    public Map<String, Double> getLocationAsMap() {
        if (this.location == null) {
            return null;
        }
        Map<String, Double> locationMap = new HashMap<>();
        locationMap.put("longitude", this.location.getX());
        locationMap.put("latitude", this.location.getY());
        return locationMap;
    }
}
