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
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny()) // Prevent Clickjacking
                        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:;"))
                        .xssProtection(xss -> xss.headerValue(org.springframework.security.web.header.writers.XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                )
                .authorizeHttpRequests(authorize -> authorize
                        // 1. PUBLIC: Anyone can use these
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/users/register").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/users/login").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/users/forgot-password").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/users/reset-password").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users/reset-password/validate").permitAll()
                        
                        // 2. ADMIN ONLY: Listing all users
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users").hasAuthority("ROLE_ADMIN")
                        
                        // 3. EVERYONE ELSE: Must be logged in
                        .anyRequest().authenticated()
                );
        
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        // Specifically list your production and dev origins
        configuration.setAllowedOrigins(java.util.List.of(
            "https://taxi-point.vercel.app",
            "http://localhost:3000",
            "http://localhost:8081"
        ));
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(java.util.List.of("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // Cache preflight for 1 hour
        
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
