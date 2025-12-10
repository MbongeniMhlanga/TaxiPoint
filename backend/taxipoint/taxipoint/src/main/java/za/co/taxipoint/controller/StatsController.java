package za.co.taxipoint.controller;

import za.co.taxipoint.dto.*;
import za.co.taxipoint.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "https://taxi-point.vercel.app")
public class StatsController {
    @Autowired
    private StatsService statsService;
    /**
     * GET /api/users/count
     * Returns total number of users from User table
     * 
     * @return Long - total count of all users
     */
    @GetMapping("/users/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Long> getTotalUserCount() {
        long count = statsService.getTotalUserCount();
        return ResponseEntity.ok(count);
    }
    /**
     * GET /api/incidents/active/count
     * Returns count of active (unresolved) incidents
     * 
     * @return Long - count of unresolved incidents
     */
    @GetMapping("/incidents/active/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Long> getActiveIncidentsCount() {
        long count = statsService.getActiveIncidentsCount();
        return ResponseEntity.ok(count);
    }
    /**
     * GET /api/users/stats
     * Returns user distribution by role from User table
     * 
     * @return UserStatsDTO - breakdown of users by role
     */
    @GetMapping("/users/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserStatsDTO> getUserStats() {
        UserStatsDTO stats = statsService.getUserStats();
        return ResponseEntity.ok(stats);
    }
}