package za.co.taxipoint.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class GeocodingService {

    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

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
}