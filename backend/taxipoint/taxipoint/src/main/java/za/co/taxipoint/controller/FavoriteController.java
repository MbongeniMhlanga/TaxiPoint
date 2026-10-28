package za.co.taxipoint.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import za.co.taxipoint.dto.TaxiRankDTO;
import za.co.taxipoint.service.FavoriteService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/favourites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    public ResponseEntity<List<TaxiRankDTO>> list(Authentication authentication) {
        return ResponseEntity.ok(favoriteService.listForUser(authentication.getName()));
    }

    @PostMapping("/{rankId}")
    public ResponseEntity<Map<String, Boolean>> add(
            Authentication authentication,
            @PathVariable UUID rankId
    ) {
        favoriteService.add(authentication.getName(), rankId);
        return ResponseEntity.ok(Map.of("favorite", true));
    }

    @DeleteMapping("/{rankId}")
    public ResponseEntity<Map<String, Boolean>> remove(
            Authentication authentication,
            @PathVariable UUID rankId
    ) {
        favoriteService.remove(authentication.getName(), rankId);
        return ResponseEntity.ok(Map.of("favorite", false));
    }

    @GetMapping("/{rankId}/status")
    public ResponseEntity<Map<String, Boolean>> status(
            Authentication authentication,
            @PathVariable UUID rankId
    ) {
        return ResponseEntity.ok(Map.of("favorite", favoriteService.isFavorite(authentication.getName(), rankId)));
    }
}
