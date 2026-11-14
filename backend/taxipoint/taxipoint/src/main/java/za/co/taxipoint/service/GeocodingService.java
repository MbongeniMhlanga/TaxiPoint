package za.co.taxipoint.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class GeocodingService {

    private static final Logger logger = LoggerFactory.getLogger(GeocodingService.class);

    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
    private static final String NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

    public GeoPoint geocode(String query) {
        if (query == null || query.isBlank()) {
            logger.warn("Geocoding skipped because the query was empty");
            return null;
        }
        // Business qualifiers such as "(Hancock)" often appear in local rank names
        // but are not part of the geographic search index.
        String searchableQuery = query.replaceAll("\\s*\\([^)]*\\)", "").replaceAll("\\s+", " ").trim();
        String locationQuery = searchableQuery.toLowerCase().contains("johannesburg")
                ? searchableQuery
                : searchableQuery + ", Johannesburg, South Africa";
        logger.info("Geocoding request received: originalQuery='{}', providerQuery='{}'", query, locationQuery);
        try {
            String url = UriComponentsBuilder.fromHttpUrl(NOMINATIM_SEARCH_URL)
                    .queryParam("q", locationQuery)
                    .queryParam("format", "json")
                    .queryParam("limit", 1)
                    .toUriString();
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "TaxiPoint/1.0 (contact@taxipoint.com)");
            ResponseEntity<NominatimSearchResponse[]> response = new RestTemplate().exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), NominatimSearchResponse[].class);
            NominatimSearchResponse[] results = response.getBody();
            logger.info("Geocoding provider response: status={}, resultCount={}", response.getStatusCode(), results == null ? 0 : results.length);
            if (results != null && results.length > 0) {
                GeoPoint point = new GeoPoint(Double.parseDouble(results[0].lat), Double.parseDouble(results[0].lon), results[0].display_name);
                logger.info("Geocoding match found: latitude={}, longitude={}, displayName='{}'", point.latitude(), point.longitude(), point.displayName());
                return point;
            }
            logger.warn("Geocoding provider returned no matches for providerQuery='{}'", locationQuery);
        } catch (Exception e) {
            logger.error("Geocoding provider request failed for providerQuery='{}': {}", locationQuery, e.getMessage(), e);
        }
        return null;
    }

public String reverseGeocode(double latitude, double longitude) {
    try {
        RestTemplate restTemplate = new RestTemplate();
        String url = UriComponentsBuilder.fromHttpUrl(NOMINATIM_URL)
                .queryParam("lat", latitude)
                .queryParam("lon", longitude)
                .queryParam("format", "json")
                .queryParam("zoom", 18)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "TaxiPoint/1.0 (contact@taxipoint.com)");

        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<NominatimResponse> responseEntity = 
            restTemplate.exchange(url, HttpMethod.GET, entity, NominatimResponse.class);

        NominatimResponse response = responseEntity.getBody();
        if (response != null && response.getDisplayName() != null) {
            return response.getDisplayName();
        }
    } catch (Exception e) {
        System.err.println("Geocoding failed for [" + latitude + "," + longitude + "]: " + e.getMessage());
    }
    return "Location not found";
}

    // Inner class to map the JSON response from Nominatim
    static class NominatimResponse {
        private String display_name;

        public String getDisplayName() {
            return display_name;
        }

        public void setDisplay_name(String display_name) {
            this.display_name = display_name;
        }
    }

    static class NominatimSearchResponse {
        public String lat;
        public String lon;
        public String display_name;
    }

    public record GeoPoint(double latitude, double longitude, String displayName) {
    }
}
