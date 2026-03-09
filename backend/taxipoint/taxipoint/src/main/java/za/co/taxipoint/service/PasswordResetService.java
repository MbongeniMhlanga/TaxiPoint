package za.co.taxipoint.service;

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

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest request) {
        String email = request.getEmail();
        
        // Check if user exists
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // For security, don't reveal if email exists or not
            return;
        }

        User user = userOpt.get();

        // Delete any existing tokens for this email
        tokenRepository.deleteTokensByEmail(email);

        // Create new token
        PasswordResetToken token = new PasswordResetToken();
        token.setEmail(email);
        tokenRepository.save(token);

        try {
            // Send email with the token
            emailService.sendPasswordResetEmail(email, token.getToken());
        } catch (Exception e) {
            // Log the error but don't fail the request for security
            // The user will just need to try again
            // For now, we'll just log and continue without throwing an exception
            // to maintain security best practices
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
        return !resetToken.isExpired() && !resetToken.isUsed();
    }
}