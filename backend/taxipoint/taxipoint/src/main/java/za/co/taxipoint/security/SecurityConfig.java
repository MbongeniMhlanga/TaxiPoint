package za.co.taxipoint.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // By injecting the JwtAuthenticationFilter, we tell Spring to provide its bean
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(authorize -> authorize
                        // Allow registration and login without authentication
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/users/register").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/users/login").permitAll()
                        
                        // Require an ADMIN role for POST requests to /api/taxi-ranks
                        //.requestMatchers(org.springframework.http.HttpMethod.POST, "/api/taxi-ranks")
                        //.hasRole("ADMIN")
                        .anyRequest().permitAll()

                        // All other requests require authentication
                        //.anyRequest().authenticated()
                );
        
        // This is the critical line that adds your JwtAuthenticationFilter to the security chain.
        // It ensures the JWT token is processed and the user is authenticated BEFORE the
        // role-based rules are checked. This is the fix for your 403 error.
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
