package za.co.taxipoint.controller;

import za.co.taxipoint.dto.*;
import za.co.taxipoint.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stats")  // ✅ CHANGED: Avoids conflict
@CrossOrigin(origins = {
    "https://taxi-point.vercel.app",
    "http://localhost:*",
    "http://localhost:3000",
    "http://localhost:8081",
    "http://10.0.2.2:*"
})
public class StatsController {
    
    @Autowired
    private StatsService statsService;

    /**
     * GET /api/stats/users/count
     */
    @GetMapping("/users/count")
    @PreAuthorize("hasRole('ADMIN')")  // ✅ FIXED
    public ResponseEntity<Long> getTotalUserCount() {
        long count = statsService.getTotalUserCount();
        return ResponseEntity.ok(count);
    }

    /**
     * GET /api/stats/incidents/active
     */
    @GetMapping("/incidents/active")  // ✅ SIMPLIFIED
    @PreAuthorize("hasRole('ADMIN')")  // ✅ FIXED
    public ResponseEntity<Long> getActiveIncidentsCount() {
        long count = statsService.getActiveIncidentsCount();
        return ResponseEntity.ok(count);
    }

    /**
     * GET /api/stats/users/distribution
     */
    @GetMapping("/users/distribution")  // ✅ CHANGED
    @PreAuthorize("hasRole('ADMIN')")  // ✅ FIXED
    public ResponseEntity<UserStatsDTO> getUserStats() {
        UserStatsDTO stats = statsService.getUserStats();
        return ResponseEntity.ok(stats);
    }
}