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
        
        logger.info("Password reset token generated for email: {}", email);
        
        // Additional debug: Check if token is already expired right after creation (Check logic only)
        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            logger.error("CRITICAL: Token created with an already past expiry date!");
        }

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
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isEmpty()) {
            return false;
        }

        PasswordResetToken resetToken = tokenOpt.get();
        boolean isValid = !resetToken.isExpired() && !resetToken.isUsed();
        
        logger.info("Token validation result for email {}: valid={}", resetToken.getEmail(), isValid);
        
        return isValid;
    }
}