package za.co.taxipoint.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${application.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String toEmail, String token) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject("Password Reset Request");

        String resetUrl = frontendUrl + "/reset-password?token=" + token;

        String htmlContent = buildPasswordResetEmail(toEmail, resetUrl);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }

    private String buildPasswordResetEmail(String name, String resetUrl) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8'>" +
                "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "<title>Password Reset</title>" +
                "<style>" +
                "body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }" +
                ".container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }" +
                ".header { text-align: center; margin-bottom: 30px; }" +
                ".logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }" +
                ".title { font-size: 20px; font-weight: bold; margin-bottom: 20px; }" +
                ".content { margin-bottom: 30px; }" +
                ".highlight { background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }" +
                ".button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }" +
                ".button:hover { background-color: #1d4ed8; }" +
                ".footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }" +
                ".warning { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; padding: 10px; margin: 20px 0; font-size: 14px; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'>" +
                "<div class='logo'>TaxiPoint</div>" +
                "<h1 class='title'>Password Reset Request</h1>" +
                "</div>" +
                "<div class='content'>" +
                "<p>Hello " + name + ",</p>" +
                "<p>We received a request to reset your password for your TaxiPoint account. If you made this request, click the button below to reset your password:</p>" +
                "<div class='highlight'>" +
                "<p><strong>This link will expire in 15 minutes for security reasons.</strong></p>" +
                "</div>" +
                "<div style='text-align: center;'>" +
                "<a href='" + resetUrl + "' class='button'>Reset My Password</a>" +
                "</div>" +
                "<p>Or copy and paste this link into your browser:</p>" +
                "<p style='word-break: break-all; background-color: #f8fafc; padding: 10px; border-radius: 4px; font-family: monospace;'>" + resetUrl + "</p>" +
                "<div class='warning'>" +
                "<strong>Security Notice:</strong> If you did not request this password reset, please ignore this email. Your password will not be changed unless you complete the reset process using the link above." +
                "</div>" +
                "</div>" +
                "<div class='footer'>" +
                "<p>If you continue to have problems, please contact our support team.</p>" +
                "<p>&copy; 2024 TaxiPoint. All rights reserved.</p>" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }
}