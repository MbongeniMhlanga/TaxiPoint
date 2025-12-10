package za.co.taxipoint.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.co.taxipoint.model.User;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
   /**
     * Count users by role from the User table
     * This queries: SELECT COUNT(*) FROM users WHERE role = ?
     */
    long countByRole(String role);
}
