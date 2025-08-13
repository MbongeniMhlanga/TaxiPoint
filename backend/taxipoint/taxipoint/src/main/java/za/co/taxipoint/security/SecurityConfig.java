package za.co.taxipoint.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Creates and exposes a BCryptPasswordEncoder bean to the Spring application context.
     * This bean can then be automatically injected into any component that requires a
     * PasswordEncoder, such as the UserService.
     *
     * @return a new instance of BCryptPasswordEncoder
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Configures the security filter chain. This method sets up rules for which
     * endpoints are secured and which are publicly accessible.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF protection for API endpoints as they are stateless
            .csrf(csrf -> csrf.disable())
            
            // Configure authorization rules for HTTP requests
            .authorizeHttpRequests(authorize -> authorize
                // Allow unauthenticated POST requests to the /api/users/register endpoint
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/users/register").permitAll()
                
                // Allow unauthenticated POST requests to the /api/users/login endpoint
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/users/login").permitAll()

                // All other requests must be authenticated
                .anyRequest().authenticated()
            );

        return http.build();
    }
}
