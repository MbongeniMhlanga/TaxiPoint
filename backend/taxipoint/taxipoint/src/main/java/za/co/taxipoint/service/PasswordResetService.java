package za.co.taxipoint.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.taxipoint.dto.ForgotPasswordRequest;
import za.co.taxipoint.dto.ResetPasswordRequest;
import za.co.taxipoint.model.PasswordResetToken;
import za.co.taxipoint.model.User;
import za.co.taxipoint.repository.PasswordResetTokenRepository;
import za.co.taxipoint.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SendGridEmailService emailService;

    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest request) {
        String email = request.getEmail();
        
        // Check if user exists
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // For security, don't reveal if email exists or not
            // But we can log this for debugging
            logger.info("Password reset requested for non-existent email: {}", email);
            return;
        }

        User user = userOpt.get();

        // Delete any existing tokens for this email
        tokenRepository.deleteTokensByEmail(email);
        logger.info("Deleted existing tokens for email: {}", email);

        // Create new token
        PasswordResetToken token = new PasswordResetToken();
        token.setEmail(email);
        tokenRepository.save(token);
        
        logger.info("=== TOKEN CREATION DEBUG ===");
        logger.info("Token created for email: {}", email);
        logger.info("Token value: {}", token.getToken());
        logger.info("Token expiry: {}", token.getExpiryDate());
        logger.info("Token used status: {}", token.isUsed());
        logger.info("Token expired status: {}", token.isExpired());
        logger.info("Current time: {}", LocalDateTime.now());
        logger.info("Time difference (minutes): {}", java.time.Duration.between(LocalDateTime.now(), token.getExpiryDate()).toMinutes());
        
        // Additional debug: Check if token is already expired right after creation
        if (token.isExpired()) {
            logger.error("CRITICAL: Token is expired immediately after creation!");
            logger.error("Current time: {}", LocalDateTime.now());
            logger.error("Token expiry: {}", token.getExpiryDate());
            logger.error("Time difference: {}", java.time.Duration.between(LocalDateTime.now(), token.getExpiryDate()).toMinutes());
        } else {
            logger.info("✓ Token is valid after creation");
        }
        
        logger.info("============================");

        try {
            // Send email with the token
            emailService.sendPasswordResetEmail(email, token.getToken());
            logger.info("Password reset email sent successfully for token: {}", token.getToken());
        } catch (Exception e) {
            logger.error("Failed to send password reset email for token {}: {}", token.getToken(), e.getMessage());
            // Don't delete the token - user can try again
            // Just log the error and continue for security
        }
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String token = request.getToken();
        String newPassword = request.getNewPassword();
        String confirmPassword = request.getConfirmPassword();

        // Validate passwords match
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        // Find and validate token
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));

        if (resetToken.isExpired()) {
            throw new IllegalArgumentException("Token has expired");
        }

        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("Token has already been used");
        }

        // Find user
        User user = userRepository.findByEmail(resetToken.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        // Clean up expired tokens (optional cleanup)
        tokenRepository.deleteExpiredTokens(LocalDateTime.now());
    }

    public boolean isTokenValid(String token) {
        logger.info("=== TOKEN VALIDATION DEBUG ===");
        logger.info("Validating token: {}", token);
        
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isEmpty()) {
            logger.info("Token validation failed: Token not found: {}", token);
            return false;
        }

        PasswordResetToken resetToken = tokenOpt.get();
        logger.info("Token found in database:");
        logger.info("  - Token value: {}", resetToken.getToken());
        logger.info("  - Email: {}", resetToken.getEmail());
        logger.info("  - Created at: {}", resetToken.getCreatedAt());
        logger.info("  - Expiry date: {}", resetToken.getExpiryDate());
        logger.info("  - Used status: {}", resetToken.isUsed());
        logger.info("  - Current time: {}", LocalDateTime.now());
        logger.info("  - Is expired: {}", resetToken.isExpired());
        
        boolean isValid = !resetToken.isExpired() && !resetToken.isUsed();
        
        logger.info("Token validation for {}: exists={}, expired={}, used={}, valid={}", 
                   token, true, resetToken.isExpired(), resetToken.isUsed(), isValid);
        logger.info("================================");
        
        return isValid;
    }
}