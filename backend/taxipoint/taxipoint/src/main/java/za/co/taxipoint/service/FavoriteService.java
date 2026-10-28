package za.co.taxipoint.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import za.co.taxipoint.dto.TaxiRankDTO;
import za.co.taxipoint.model.Favorite;
import za.co.taxipoint.model.TaxiRank;
import za.co.taxipoint.model.User;
import za.co.taxipoint.repository.FavoriteRepository;
import za.co.taxipoint.repository.TaxiRankRepository;
import za.co.taxipoint.repository.UserRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final TaxiRankRepository taxiRankRepository;
    private final TaxiRankService taxiRankService;

    @Transactional(readOnly = true)
    public List<TaxiRankDTO> listForUser(String email) {
        User user = findUser(email);
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(Favorite::getTaxiRank)
                .filter(TaxiRank::getActive)
                .map(taxiRankService::toDTO)
                .toList();
    }

    @Transactional
    public void add(String email, UUID rankId) {
        User user = findUser(email);
        TaxiRank rank = taxiRankRepository.findById(rankId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Taxi rank not found."));

        if (!favoriteRepository.existsByUserIdAndTaxiRankId(user.getId(), rankId)) {
            Favorite favorite = new Favorite();
            favorite.setUser(user);
            favorite.setTaxiRank(rank);
            favoriteRepository.save(favorite);
        }
    }

    @Transactional
    public void remove(String email, UUID rankId) {
        User user = findUser(email);
        favoriteRepository.findByUserIdAndTaxiRankId(user.getId(), rankId)
                .ifPresent(favoriteRepository::delete);
    }

    @Transactional(readOnly = true)
    public boolean isFavorite(String email, UUID rankId) {
        return favoriteRepository.existsByUserIdAndTaxiRankId(findUser(email).getId(), rankId);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account not found."));
    }
}
