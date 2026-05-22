package za.co.taxipoint.service;

import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.taxipoint.dto.CorrectionReviewRequest;
import za.co.taxipoint.dto.CorrectionSubmissionDTO;
import za.co.taxipoint.dto.CorrectionSubmissionRequest;
import za.co.taxipoint.dto.CorrectionVoteRequest;
import za.co.taxipoint.model.CorrectionStatus;
import za.co.taxipoint.model.CorrectionSubmission;
import za.co.taxipoint.model.CorrectionType;
import za.co.taxipoint.model.CorrectionVote;
import za.co.taxipoint.model.CorrectionVoteType;
import za.co.taxipoint.model.ReviewDecision;
import za.co.taxipoint.model.TaxiRank;
import za.co.taxipoint.model.User;
import za.co.taxipoint.repository.CorrectionSubmissionRepository;
import za.co.taxipoint.repository.CorrectionVoteRepository;
import za.co.taxipoint.repository.TaxiRankRepository;
import za.co.taxipoint.repository.UserRepository;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CorrectionService {

    private final CorrectionSubmissionRepository submissionRepository;
    private final CorrectionVoteRepository voteRepository;
    private final UserRepository userRepository;
    private final TaxiRankRepository taxiRankRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public CorrectionSubmissionDTO submitCorrection(String email, CorrectionSubmissionRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CorrectionSubmission submission = new CorrectionSubmission();
        submission.setRankId(request.getRankId());
        submission.setRankNameSnapshot(resolveRankNameSnapshot(request));
        submission.setCorrectionType(request.getCorrectionType());
        submission.setDescription(request.getDescription().trim());
        submission.setDetails(safeDetails(request.getDetails()));
        submission.setStatus(CorrectionStatus.PENDING);
        submission.setSubmittedByUserId(user.getId());
        submission.setSubmittedByEmail(user.getEmail());
        submission.setSubmittedByName(user.getName() + " " + user.getSurname());

        return toDTO(submissionRepository.save(submission));
    }

    public CorrectionSubmissionDTO vote(UUID submissionId, String email, CorrectionVoteRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CorrectionSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Correction submission not found"));

        if (submission.getStatus() == CorrectionStatus.APPROVED || submission.getStatus() == CorrectionStatus.REJECTED) {
            throw new IllegalStateException("This correction has already been finalized.");
        }

        CorrectionVote vote = voteRepository.findBySubmissionIdAndVoterUserId(submissionId, user.getId())
                .orElseGet(CorrectionVote::new);

        vote.setSubmissionId(submissionId);
        vote.setVoterUserId(user.getId());
        vote.setVoterEmail(user.getEmail());
        vote.setVoteType(request.getVoteType());
        voteRepository.save(vote);

        refreshVoteCounts(submission);
        applyAutomaticTransitions(submission);

        return toDTO(submissionRepository.save(submission));
    }

    public List<CorrectionSubmissionDTO> getPendingSubmissions() {
        return submissionRepository.findByStatusInOrderByCreatedAtDesc(List.of(CorrectionStatus.PENDING, CorrectionStatus.FLAGGED))
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public List<CorrectionSubmissionDTO> getMySubmissions(String email) {
        return submissionRepository.findBySubmittedByEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public Optional<CorrectionSubmissionDTO> getById(UUID id) {
        return submissionRepository.findById(id).map(this::toDTO);
    }

    public CorrectionSubmissionDTO reviewSubmission(UUID id, String adminEmail, CorrectionReviewRequest request) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CorrectionSubmission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Correction submission not found"));

        if (submission.getStatus() == CorrectionStatus.APPROVED || submission.getStatus() == CorrectionStatus.REJECTED) {
            throw new IllegalStateException("This correction has already been finalized.");
        }

        if (request.getDecision() == ReviewDecision.APPROVE) {
            applyCorrection(submission);
            submission.setStatus(CorrectionStatus.APPROVED);
        } else {
            submission.setStatus(CorrectionStatus.REJECTED);
        }

        submission.setReviewedByUserId(admin.getId());
        submission.setReviewedByEmail(admin.getEmail());
        submission.setReviewedAt(java.time.LocalDateTime.now());
        submission.setReviewNotes(request.getReviewNotes());
        submission.setAutoApproved(false);

        return toDTO(submissionRepository.save(submission));
    }

    private void refreshVoteCounts(CorrectionSubmission submission) {
        long confirmations = voteRepository.countBySubmissionIdAndVoteType(submission.getId(), CorrectionVoteType.CONFIRM);
        long rejections = voteRepository.countBySubmissionIdAndVoteType(submission.getId(), CorrectionVoteType.REJECT);

        submission.setConfirmationsCount((int) confirmations);
        submission.setRejectionsCount((int) rejections);
    }

    private void applyAutomaticTransitions(CorrectionSubmission submission) {
        if (submission.getConfirmationsCount() >= 10) {
            applyCorrection(submission);
            submission.setStatus(CorrectionStatus.APPROVED);
            submission.setAutoApproved(true);
            submission.setReviewedAt(java.time.LocalDateTime.now());
            submission.setReviewedByEmail("SYSTEM");
            submission.setReviewNotes("Auto-approved after 10 confirmations.");
            return;
        }

        if (submission.getRejectionsCount() >= 3 && submission.getStatus() == CorrectionStatus.PENDING) {
            submission.setStatus(CorrectionStatus.FLAGGED);
            submission.setAutoApproved(false);
        }
    }

    private void applyCorrection(CorrectionSubmission submission) {
        CorrectionType type = submission.getCorrectionType();
        if (type == CorrectionType.MISSING_RANK) {
            createOrUpdateMissingRank(submission);
            return;
        }

        UUID rankId = submission.getRankId();
        if (rankId == null) {
            return;
        }

        TaxiRank rank = taxiRankRepository.findById(rankId).orElse(null);
        if (rank == null) {
            if (type == CorrectionType.MISSING_RANK) {
                createOrUpdateMissingRank(submission);
            }
            return;
        }

        Map<String, Object> details = safeDetails(submission.getDetails());

        switch (type) {
            case WRONG_FARE -> applyWrongFare(rank, details);
            case MISSING_ROUTE -> applyMissingRoute(rank, details);
            case WRONG_ROUTE_NUMBER, ROUTE_CHANGE -> applyRouteChange(rank, details);
            case RANK_CLOSED -> rank.setActive(false);
            default -> {
                // No automatic patching for generic corrections.
            }
        }

        taxiRankRepository.save(rank);
    }

    private void applyWrongFare(TaxiRank rank, Map<String, Object> details) {
        String routeName = resolveRouteName(details);
        Double fare = resolveFare(details);
        if (routeName == null || fare == null) {
            return;
        }

        Map<String, Double> routeFares = new LinkedHashMap<>();
        if (rank.getRouteFares() != null) {
            routeFares.putAll(rank.getRouteFares());
        }

        String matchedKey = findMatchingKey(routeFares.keySet(), routeName);
        routeFares.put(matchedKey != null ? matchedKey : routeName, fare);
        rank.setRouteFares(routeFares);
    }

    private void applyMissingRoute(TaxiRank rank, Map<String, Object> details) {
        String routeName = resolveRouteName(details);
        if (routeName == null) {
            return;
        }

        List<String> routes = new ArrayList<>();
        if (rank.getRoutesServed() != null) {
            routes.addAll(rank.getRoutesServed());
        }
        if (routes.stream().noneMatch(route -> route.equalsIgnoreCase(routeName))) {
            routes.add(routeName);
        }
        rank.setRoutesServed(routes);

        Double fare = resolveFare(details);
        if (fare != null) {
            Map<String, Double> routeFares = new LinkedHashMap<>();
            if (rank.getRouteFares() != null) {
                routeFares.putAll(rank.getRouteFares());
            }
            String matchedKey = findMatchingKey(routeFares.keySet(), routeName);
            routeFares.put(matchedKey != null ? matchedKey : routeName, fare);
            rank.setRouteFares(routeFares);
        }
    }

    private void applyRouteChange(TaxiRank rank, Map<String, Object> details) {
        String oldRoute = firstNonBlank(resolveString(details, "oldRoute"), resolveString(details, "route"), resolveString(details, "destination"));
        String newRoute = firstNonBlank(resolveString(details, "newRoute"), resolveString(details, "correctedRoute"), resolveString(details, "updatedRoute"));
        if (oldRoute == null || newRoute == null) {
            return;
        }

        List<String> routes = new ArrayList<>();
        if (rank.getRoutesServed() != null) {
            routes.addAll(rank.getRoutesServed());
        }

        String matchedOldRoute = findMatchingKey(routes, oldRoute);
        if (matchedOldRoute != null) {
            routes.removeIf(route -> route.equalsIgnoreCase(matchedOldRoute));
        }
        if (routes.stream().noneMatch(route -> route.equalsIgnoreCase(newRoute))) {
            routes.add(newRoute);
        }
        rank.setRoutesServed(routes);

        Map<String, Double> routeFares = new LinkedHashMap<>();
        if (rank.getRouteFares() != null) {
            routeFares.putAll(rank.getRouteFares());
        }

        String matchedFareKey = findMatchingKey(routeFares.keySet(), oldRoute);
        Double existingFare = matchedFareKey != null ? routeFares.remove(matchedFareKey) : null;
        Double explicitFare = resolveFare(details);
        Double finalFare = explicitFare != null ? explicitFare : existingFare;
        if (finalFare != null) {
            routeFares.put(newRoute, finalFare);
        }
        rank.setRouteFares(routeFares);
    }

    private void createOrUpdateMissingRank(CorrectionSubmission submission) {
        Map<String, Object> details = safeDetails(submission.getDetails());
        String name = firstNonBlank(resolveString(details, "name"), submission.getRankNameSnapshot());
        String address = resolveString(details, "address");
        String district = resolveString(details, "district");
        Double latitude = resolveNumber(details, "latitude");
        Double longitude = resolveNumber(details, "longitude");

        if (name == null || address == null || district == null || latitude == null || longitude == null) {
            return;
        }

        TaxiRank rank = taxiRankRepository.findAll().stream()
                .filter(existing -> existing.getName() != null && existing.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(TaxiRank::new);

        rank.setName(name);
        rank.setAddress(address);
        rank.setDistrict(district);
        rank.setDescription(firstNonBlank(resolveString(details, "description"), submission.getDescription()));
        rank.setActive(true);

        List<String> routesServed = extractStringList(details, "routesServed");
        if (!routesServed.isEmpty()) {
            rank.setRoutesServed(routesServed);
        }

        Map<String, Double> routeFares = extractNumberMap(details, "routeFares");
        if (!routeFares.isEmpty()) {
            rank.setRouteFares(routeFares);
        }

        Map<String, String> hours = extractStringMap(details, "hours");
        if (!hours.isEmpty()) {
            rank.setHours(hours);
        }

        Map<String, Object> facilities = extractObjectMap(details, "facilities");
        if (!facilities.isEmpty()) {
            rank.setFacilities(facilities);
        }

        String phone = resolveString(details, "phone");
        if (phone != null) {
            rank.setPhone(phone);
        }

        String currency = resolveString(details, "currency");
        if (currency != null && !currency.isBlank()) {
            rank.setCurrency(currency.trim().toUpperCase());
        }

        Point location = geometryFactory.createPoint(new Coordinate(longitude, latitude));
        location.setSRID(4326);
        rank.setLocation(location);

        taxiRankRepository.save(rank);
    }

    private Map<String, Object> safeDetails(Map<String, Object> details) {
        return details == null ? new LinkedHashMap<>() : new LinkedHashMap<>(details);
    }

    private String resolveRankNameSnapshot(CorrectionSubmissionRequest request) {
        String snapshot = request.getRankNameSnapshot();
        if (snapshot != null && !snapshot.isBlank()) {
            return snapshot.trim();
        }
        if (request.getRankId() != null) {
            return taxiRankRepository.findById(request.getRankId())
                    .map(TaxiRank::getName)
                    .orElse(null);
        }
        return null;
    }

    private String resolveRouteName(Map<String, Object> details) {
        return firstNonBlank(
                resolveString(details, "route"),
                resolveString(details, "destination"),
                resolveString(details, "routeName")
        );
    }

    private Double resolveFare(Map<String, Object> details) {
        return firstNonNull(
                resolveNumber(details, "fare"),
                resolveNumber(details, "currentFare"),
                resolveNumber(details, "newFare"),
                resolveNumber(details, "proposedFare")
        );
    }

    private String resolveString(Map<String, Object> details, String key) {
        Object value = details.get(key);
        if (value == null) {
            return null;
        }
        String stringValue = String.valueOf(value).trim();
        return stringValue.isBlank() ? null : stringValue;
    }

    private Double resolveNumber(Map<String, Object> details, String key) {
        Object value = details.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.valueOf(String.valueOf(value).trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private List<String> extractStringList(Map<String, Object> details, String key) {
        Object value = details.get(key);
        if (value instanceof Collection<?> collection) {
            return collection.stream()
                    .map(String::valueOf)
                    .map(String::trim)
                    .filter(item -> !item.isBlank())
                    .toList();
        }
        if (value instanceof String stringValue) {
            return java.util.Arrays.stream(stringValue.split(","))
                    .map(String::trim)
                    .filter(item -> !item.isBlank())
                    .toList();
        }
        return List.of();
    }

    private Map<String, Double> extractNumberMap(Map<String, Object> details, String key) {
        Object value = details.get(key);
        if (!(value instanceof Map<?, ?> map)) {
            return Map.of();
        }

        Map<String, Double> result = new LinkedHashMap<>();
        map.forEach((mapKey, mapValue) -> {
            if (mapKey == null || mapValue == null) {
                return;
            }
            String route = String.valueOf(mapKey).trim();
            if (route.isBlank()) {
                return;
            }
            Double amount = null;
            if (mapValue instanceof Number number) {
                amount = number.doubleValue();
            } else {
                try {
                    amount = Double.valueOf(String.valueOf(mapValue).trim());
                } catch (NumberFormatException ignored) {
                }
            }
            if (amount != null) {
                result.put(route, amount);
            }
        });
        return result;
    }

    private Map<String, String> extractStringMap(Map<String, Object> details, String key) {
        Object value = details.get(key);
        if (!(value instanceof Map<?, ?> map)) {
            return Map.of();
        }

        Map<String, String> result = new LinkedHashMap<>();
        map.forEach((mapKey, mapValue) -> {
            if (mapKey == null || mapValue == null) {
                return;
            }
            String stringKey = String.valueOf(mapKey).trim();
            String stringValue = String.valueOf(mapValue).trim();
            if (!stringKey.isBlank() && !stringValue.isBlank()) {
                result.put(stringKey, stringValue);
            }
        });
        return result;
    }

    private Map<String, Object> extractObjectMap(Map<String, Object> details, String key) {
        Object value = details.get(key);
        if (!(value instanceof Map<?, ?> map)) {
            return Map.of();
        }

        Map<String, Object> result = new LinkedHashMap<>();
        map.forEach((mapKey, mapValue) -> {
            if (mapKey == null || mapValue == null) {
                return;
            }
            String stringKey = String.valueOf(mapKey).trim();
            if (!stringKey.isBlank()) {
                result.put(stringKey, mapValue);
            }
        });
        return result;
    }

    private String findMatchingKey(Collection<String> candidates, String target) {
        if (target == null) {
            return null;
        }
        return candidates.stream()
                .filter(candidate -> candidate != null && candidate.trim().equalsIgnoreCase(target.trim()))
                .findFirst()
                .orElse(null);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.trim().isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    @SafeVarargs
    private final <T> T firstNonNull(T... values) {
        for (T value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    public CorrectionSubmissionDTO toDTO(CorrectionSubmission submission) {
        CorrectionSubmissionDTO dto = new CorrectionSubmissionDTO();
        dto.setId(submission.getId());
        dto.setRankId(submission.getRankId());
        dto.setRankNameSnapshot(submission.getRankNameSnapshot());
        dto.setCorrectionType(submission.getCorrectionType());
        dto.setDescription(submission.getDescription());
        dto.setDetails(safeDetails(submission.getDetails()));
        dto.setStatus(submission.getStatus());
        dto.setConfirmationsCount(submission.getConfirmationsCount());
        dto.setRejectionsCount(submission.getRejectionsCount());
        dto.setAutoApproved(submission.isAutoApproved());
        dto.setSubmittedByUserId(submission.getSubmittedByUserId());
        dto.setSubmittedByEmail(submission.getSubmittedByEmail());
        dto.setSubmittedByName(submission.getSubmittedByName());
        dto.setReviewedByUserId(submission.getReviewedByUserId());
        dto.setReviewedByEmail(submission.getReviewedByEmail());
        dto.setReviewNotes(submission.getReviewNotes());
        dto.setReviewedAt(submission.getReviewedAt());
        dto.setCreatedAt(submission.getCreatedAt());
        dto.setUpdatedAt(submission.getUpdatedAt());
        return dto;
    }
}
