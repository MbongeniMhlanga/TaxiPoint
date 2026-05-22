package za.co.taxipoint.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import za.co.taxipoint.dto.CorrectionReviewRequest;
import za.co.taxipoint.dto.CorrectionSubmissionDTO;
import za.co.taxipoint.dto.CorrectionSubmissionRequest;
import za.co.taxipoint.dto.CorrectionVoteRequest;
import za.co.taxipoint.service.CorrectionService;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class CorrectionController {

    private final CorrectionService correctionService;

    @PostMapping
    public ResponseEntity<CorrectionSubmissionDTO> submitCorrection(
            @Valid @RequestBody CorrectionSubmissionRequest request,
            Authentication authentication
    ) {
        CorrectionSubmissionDTO submission = correctionService.submitCorrection(authentication.getName(), request);
        return ResponseEntity.created(URI.create("/api/submissions/" + submission.getId())).body(submission);
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<CorrectionSubmissionDTO> voteOnCorrection(
            @PathVariable UUID id,
            @Valid @RequestBody CorrectionVoteRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(correctionService.vote(id, authentication.getName(), request));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<CorrectionSubmissionDTO>> getPendingCorrections() {
        return ResponseEntity.ok(correctionService.getPendingSubmissions());
    }

    @GetMapping("/mine")
    public ResponseEntity<List<CorrectionSubmissionDTO>> getMyCorrections(Authentication authentication) {
        return ResponseEntity.ok(correctionService.getMySubmissions(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CorrectionSubmissionDTO> getCorrection(@PathVariable UUID id) {
        return correctionService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CorrectionSubmissionDTO> reviewCorrection(
            @PathVariable UUID id,
            @Valid @RequestBody CorrectionReviewRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(correctionService.reviewSubmission(id, authentication.getName(), request));
    }
}
