package za.co.taxipoint.service;

import za.co.taxipoint.dto.*;
import za.co.taxipoint.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
@Service
public class StatsService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private IncidentRepository incidentRepository;
    /**
     * Get total user count from User table
     * Counts all rows in the users table
     */
    public long getTotalUserCount() {
        return userRepository.count();
    }
    /**
     * Get active (unresolved) incidents count
     * Counts incidents where resolved = false
     */
    public long getActiveIncidentsCount() {
        return incidentRepository.countByResolvedFalse();
        
        // Alternative if using status field:
        // return incidentRepository.countByStatus("ACTIVE");
    }
    /**
     * Get user statistics by role
     * Counts users from User table grouped by role:
     * - ROLE_USER (regular users/commuters)
     * - ROLE_ADMIN (administrators)
     */
    public UserStatsDTO getUserStats() {
        // Query User table: SELECT COUNT(*) FROM users WHERE role = 'ROLE_USER'
        long users = userRepository.countByRole("ROLE_USER");
        
        // Query User table: SELECT COUNT(*) FROM users WHERE role = 'ROLE_ADMIN'
        long admins = userRepository.countByRole("ROLE_ADMIN");
        
        return new UserStatsDTO(users, admins);
    }
}