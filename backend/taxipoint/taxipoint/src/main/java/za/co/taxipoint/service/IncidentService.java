package za.co.taxipoint.service;

import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import za.co.taxipoint.model.Incident;
import za.co.taxipoint.repository.IncidentRepository;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public Incident createIncident(String description, String reporter, double latitude, double longitude) {
        Point point = geometryFactory.createPoint(new Coordinate(longitude, latitude));

        Incident incident = Incident.builder()
                .description(description)
                .reporter(reporter)
                .location(point)
                .build();

        return incidentRepository.save(incident);
    }
}
