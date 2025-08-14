package za.co.taxipoint.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class GeocodingService {

    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

    public String reverseGeocode(double latitude, double longitude) {
        RestTemplate restTemplate = new RestTemplate();

        String url = UriComponentsBuilder.fromHttpUrl(NOMINATIM_URL)
                .queryParam("lat", latitude)
                .queryParam("lon", longitude)
                .queryParam("format", "json")
                .queryParam("zoom", 18) // Adjust zoom level for more specific address
                .toUriString();

        NominatimResponse response = restTemplate.getForObject(url, NominatimResponse.class);

        if (response != null && response.getDisplayName() != null) {
            return response.getDisplayName();
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