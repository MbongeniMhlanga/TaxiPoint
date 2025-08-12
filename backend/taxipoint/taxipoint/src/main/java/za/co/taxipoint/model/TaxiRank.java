package za.co.taxipoint.model;

import jakarta.persistence.*;
import za.co.taxipoint.config.JsonConverter;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;

@Data  // <-- Lombok annotation to generate getters, setters, equals, hashCode, toString
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

  @Convert(converter = JsonConverter.class)
  @Column(columnDefinition = "jsonb")
  private Object routesServed;

  @Convert(converter = JsonConverter.class)
  @Column(columnDefinition = "jsonb")
  private Object hours;

  @Column(length = 20)
  private String phone;

  @Convert(converter = JsonConverter.class)
  @Column(columnDefinition = "jsonb")
  private Object facilities;

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
