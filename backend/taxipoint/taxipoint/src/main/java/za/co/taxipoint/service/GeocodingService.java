package za.co.taxipoint.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@Service
public class GeocodingService {

    private static final Logger logger = LoggerFactory.getLogger(GeocodingService.class);

    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
    private static final String NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
    private static final String GOOGLE_PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
    private final String googleMapsApiKey;

    public GeocodingService(@Value("${GOOGLE_MAPS_API_KEY:}") String googleMapsApiKey) {
        this.googleMapsApiKey = googleMapsApiKey == null ? "" : googleMapsApiKey.trim();
        logger.info("Google Places geocoder configured={}", !this.googleMapsApiKey.isBlank());
    }

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

        if (!googleMapsApiKey.isBlank()) {
            GeoPoint googlePoint = searchGooglePlaces(locationQuery);
            if (googlePoint != null) {
                return googlePoint;
            }
            logger.warn("Google Places returned no match; falling back to OpenStreetMap");
        } else {
            logger.warn("GOOGLE_MAPS_API_KEY is not configured; using OpenStreetMap geocoding");
        }

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

    private GeoPoint searchGooglePlaces(String query) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Goog-Api-Key", googleMapsApiKey);
            headers.set("X-Goog-FieldMask", "places.displayName,places.formattedAddress,places.location,places.addressComponents");
            headers.set("Content-Type", "application/json");

            Map<String, Object> requestBody = Map.of(
                    "textQuery", query,
                    "pageSize", 5
            );
            ResponseEntity<GooglePlacesSearchResponse> response = restTemplate.exchange(
                    GOOGLE_PLACES_SEARCH_URL,
                    HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    GooglePlacesSearchResponse.class
            );

            List<GooglePlace> places = response.getBody() == null ? List.of() : response.getBody().places;
            logger.info("Google Places response: status={}, resultCount={}", response.getStatusCode(), places == null ? 0 : places.size());
            if (places == null || places.isEmpty() || places.get(0).location == null) {
                return null;
            }

            GooglePlace place = places.get(0);
            String displayName = place.formattedAddress != null && !place.formattedAddress.isBlank()
                    ? place.formattedAddress
                    : place.displayName == null || place.displayName.text == null
                    ? query
                    : place.displayName.text;
            String district = extractDistrict(place.addressComponents);
            GeoPoint point = new GeoPoint(place.location.latitude, place.location.longitude, displayName, place.formattedAddress, district);
            logger.info("Google Places match found: latitude={}, longitude={}, displayName='{}'", point.latitude(), point.longitude(), point.displayName());
            return point;
        } catch (Exception e) {
            logger.error("Google Places request failed: {}", e.getMessage(), e);
            return null;
        }
    }

    private String extractDistrict(List<GoogleAddressComponent> components) {
        if (components == null) {
            return null;
        }

        return components.stream()
                .filter(component -> component.types != null && component.types.stream()
                        .anyMatch(type -> "administrative_area_level_2".equals(type)))
                .map(component -> component.longText)
                .filter(value -> value != null && !value.isBlank())
                .findFirst()
                .orElse(null);
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

    static class GooglePlacesSearchResponse {
        public List<GooglePlace> places;
    }

    static class GooglePlace {
        public GoogleDisplayName displayName;
        public String formattedAddress;
        public GoogleLocation location;
        public List<GoogleAddressComponent> addressComponents;
    }

    static class GoogleDisplayName {
        public String text;
    }

    static class GoogleLocation {
        public double latitude;
        public double longitude;
    }

    static class GoogleAddressComponent {
        public String longText;
        public List<String> types;
    }

    public record GeoPoint(double latitude, double longitude, String displayName, String address, String district) {
        public GeoPoint(double latitude, double longitude, String displayName) {
            this(latitude, longitude, displayName, displayName, null);
        }
    }
}
