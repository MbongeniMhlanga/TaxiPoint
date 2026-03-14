package za.co.taxipoint.service;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    // Cache to store buckets for different IPs/users
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    // Create a bucket for a specific key (e.g., IP address)
    // Limits to 5 requests per 10 minutes (generous for login/reset)
    public Bucket resolveBucket(String key) {
        return buckets.computeIfAbsent(key, this::createNewBucket);
    }

    private Bucket createNewBucket(String key) {
        // Refill 5 tokens every 10 minutes
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(10)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
