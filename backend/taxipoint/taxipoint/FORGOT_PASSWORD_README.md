# Forgot Password Implementation

This document describes the implementation of the forgot password feature with OTP-based password reset functionality.

## Overview

The forgot password feature allows users to reset their password by:
1. Requesting a password reset via email
2. Receiving an email with a secure reset link
3. Clicking the link to access a password reset form
4. Setting a new password

## Backend Implementation

### Models

#### PasswordResetToken
- **id**: Long (Primary Key)
- **token**: String (Unique UUID)
- **email**: String (User's email)
- **expiryDate**: LocalDateTime (15 minutes from creation)
- **used**: Boolean (Whether token has been used)
- **createdAt**: LocalDateTime
- **updatedAt**: LocalDateTime

### DTOs

#### ForgotPasswordRequest
```json
{
  "email": "user@example.com"
}
```

#### ResetPasswordRequest
```json
{
  "token": "uuid-token-string",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

### Services

#### EmailService
- Sends password reset emails with HTML templates
- Configurable frontend URL for reset links
- Professional email template with security warnings

#### PasswordResetService
- **requestPasswordReset()**: Creates token and sends email
- **resetPassword()**: Validates token and updates password
- **isTokenValid()**: Checks token validity

### Controllers

#### UserController Endpoints

1. **POST /api/users/forgot-password**
   - Request body: ForgotPasswordRequest
   - Response: Success message
   - Security: Doesn't reveal if email exists

2. **POST /api/users/reset-password**
   - Request body: ResetPasswordRequest
   - Response: Success message or error
   - Validation: Token expiry, usage, password matching

### Security Features

- Tokens expire after 15 minutes
- Tokens can only be used once
- No indication if email exists in system
- Secure UUID-based tokens
- Password validation requirements

## Frontend Implementation

### Components

#### ForgotPassword
- Email input form
- Loading states
- Success confirmation
- Automatic redirect to login

#### ResetPassword
- Token validation on load
- Password strength indicator
- Password confirmation
- Real-time validation

### Routes

- `/forgot-password` - Request password reset
- `/reset-password?token=...` - Reset password with token

## Configuration

### Email Configuration (application.properties)
```properties
# Email configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${SPRING_MAIL_USERNAME:your-email@gmail.com}
spring.mail.password=${SPRING_MAIL_PASSWORD:your-app-password}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true

# Frontend URL for password reset links
application.frontend.url=${FRONTEND_URL:http://localhost:3000}
```

### Environment Variables
- `SPRING_MAIL_USERNAME`: Email address for sending
- `SPRING_MAIL_PASSWORD`: App password for Gmail
- `FRONTEND_URL`: Base URL for reset links

## Usage Flow

### 1. Request Password Reset
```bash
curl -X POST http://localhost:8080/api/users/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### 2. Email Sent
User receives email with reset link:
```
http://localhost:3000/reset-password?token=abc123-uuid-token
```

### 3. Reset Password
```bash
curl -X POST http://localhost:8080/api/users/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123-uuid-token",
    "newPassword": "newpassword123",
    "confirmPassword": "newpassword123"
  }'
```

## Testing

### Unit Tests
- PasswordResetServiceTest.java
- Tests all service methods
- Mock dependencies
- Edge case coverage

### Test Scenarios
- Valid password reset request
- Invalid/expired/used tokens
- Password validation
- Email service integration

## Security Considerations

1. **Token Security**
   - UUID-based tokens
   - 15-minute expiration
   - Single use only
   - Secure generation

2. **Email Security**
   - Professional templates
   - Clear security warnings
   - Expiration notices

3. **API Security**
   - No email existence disclosure
   - Input validation
   - Error handling

4. **Password Security**
   - Minimum length requirements
   - Strength validation
   - Secure hashing

## Troubleshooting

### Common Issues

1. **Email Not Sent**
   - Check SMTP configuration
   - Verify app password for Gmail
   - Check firewall/network settings

2. **Token Validation Errors**
   - Check token expiration
   - Verify token hasn't been used
   - Check database connectivity

3. **Frontend Integration**
   - Verify API base URL
   - Check CORS configuration
   - Ensure proper routing

### Logs
- Check application logs for email errors
- Monitor token creation/deletion
- Track API request patterns

## Dependencies

### Backend
- Spring Boot Starter Mail
- JavaMail API
- Lombok
- JUnit 5 (testing)

### Frontend
- React Router
- Toast notifications
- Form validation
- Password strength checking