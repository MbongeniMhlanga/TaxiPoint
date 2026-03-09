package za.co.taxipoint.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.mail.MessagingException;
import za.co.taxipoint.dto.ForgotPasswordRequest;
import za.co.taxipoint.dto.ResetPasswordRequest;
import za.co.taxipoint.model.PasswordResetToken;
import za.co.taxipoint.model.User;
import za.co.taxipoint.repository.PasswordResetTokenRepository;
import za.co.taxipoint.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PasswordResetServiceTest {

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private PasswordResetService passwordResetService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRequestPasswordReset_UserExists() {
        // Given
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("test@example.com");

        User user = new User();
        user.setEmail("test@example.com");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(tokenRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

        // When
        passwordResetService.requestPasswordReset(request);

        // Then
        verify(tokenRepository).deleteTokensByEmail("test@example.com");
        verify(tokenRepository).save(any(PasswordResetToken.class));
        try {
            verify(emailService).sendPasswordResetEmail(eq("test@example.com"), anyString());
        } catch (MessagingException e) {
            fail("Unexpected MessagingException", e);
        }
    }

    @Test
    void testRequestPasswordReset_UserDoesNotExist() {
        // Given
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("nonexistent@example.com");

        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When
        passwordResetService.requestPasswordReset(request);

        // Then
        verify(tokenRepository, never()).save(any(PasswordResetToken.class));
        try {
            verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
        } catch (MessagingException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
    }

    @Test
    void testResetPassword_ValidToken() {
        // Given
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("valid-token");
        request.setNewPassword("newpassword123");
        request.setConfirmPassword("newpassword123");

        PasswordResetToken token = new PasswordResetToken();
        token.setToken("valid-token");
        token.setEmail("test@example.com");
        token.setExpiryDate(LocalDateTime.now().plusMinutes(10));
        token.setUsed(false);

        User user = new User();
        user.setEmail("test@example.com");

        when(tokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newpassword123")).thenReturn("encoded-password");

        // When
        passwordResetService.resetPassword(request);

        // Then
        verify(userRepository).save(user);
        verify(tokenRepository).save(token);
        assertEquals("encoded-password", user.getPasswordHash());
        assertTrue(token.isUsed());
    }

    @Test
    void testResetPassword_PasswordsDoNotMatch() {
        // Given
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("valid-token");
        request.setNewPassword("newpassword123");
        request.setConfirmPassword("differentpassword");

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            passwordResetService.resetPassword(request);
        });

        verify(userRepository, never()).save(any(User.class));
        verify(tokenRepository, never()).save(any(PasswordResetToken.class));
    }

    @Test
    void testResetPassword_ExpiredToken() {
        // Given
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("expired-token");
        request.setNewPassword("newpassword123");
        request.setConfirmPassword("newpassword123");

        PasswordResetToken token = new PasswordResetToken();
        token.setToken("expired-token");
        token.setExpiryDate(LocalDateTime.now().minusMinutes(10)); // Expired

        when(tokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            passwordResetService.resetPassword(request);
        });

        verify(userRepository, never()).save(any(User.class));
        verify(tokenRepository, never()).save(any(PasswordResetToken.class));
    }

    @Test
    void testResetPassword_UsedToken() {
        // Given
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("used-token");
        request.setNewPassword("newpassword123");
        request.setConfirmPassword("newpassword123");

        PasswordResetToken token = new PasswordResetToken();
        token.setToken("used-token");
        token.setExpiryDate(LocalDateTime.now().plusMinutes(10));
        token.setUsed(true);

        when(tokenRepository.findByToken("used-token")).thenReturn(Optional.of(token));

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            passwordResetService.resetPassword(request);
        });

        verify(userRepository, never()).save(any(User.class));
        verify(tokenRepository, never()).save(any(PasswordResetToken.class));
    }

    @Test
    void testIsTokenValid_ValidToken() {
        // Given
        PasswordResetToken token = new PasswordResetToken();
        token.setToken("valid-token");
        token.setExpiryDate(LocalDateTime.now().plusMinutes(10));
        token.setUsed(false);

        when(tokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));

        // When
        boolean isValid = passwordResetService.isTokenValid("valid-token");

        // Then
        assertTrue(isValid);
    }

    @Test
    void testIsTokenValid_InvalidToken() {
        // Given
        when(tokenRepository.findByToken("invalid-token")).thenReturn(Optional.empty());

        // When
        boolean isValid = passwordResetService.isTokenValid("invalid-token");

        // Then
        assertFalse(isValid);
    }

    @Test
    void testIsTokenValid_ExpiredToken() {
        // Given
        PasswordResetToken token = new PasswordResetToken();
        token.setToken("expired-token");
        token.setExpiryDate(LocalDateTime.now().minusMinutes(10));
        token.setUsed(false);

        when(tokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        // When
        boolean isValid = passwordResetService.isTokenValid("expired-token");

        // Then
        assertFalse(isValid);
    }

    @Test
    void testIsTokenValid_UsedToken() {
        // Given
        PasswordResetToken token = new PasswordResetToken();
        token.setToken("used-token");
        token.setExpiryDate(LocalDateTime.now().plusMinutes(10));
        token.setUsed(true);

        when(tokenRepository.findByToken("used-token")).thenReturn(Optional.of(token));

        // When
        boolean isValid = passwordResetService.isTokenValid("used-token");

        // Then
        assertFalse(isValid);
    }
}