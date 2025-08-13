package za.co.taxipoint.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import za.co.taxipoint.dto.UserDTO;
import za.co.taxipoint.dto.UserLoginDTO;
import za.co.taxipoint.dto.UserRegisterDTO;
import za.co.taxipoint.model.User;
import za.co.taxipoint.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserDTO registerUser(UserRegisterDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = new User();
        user.setName(dto.getName());
        user.setSurname(dto.getSurname());
        user.setEmail(dto.getEmail());
        user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));

        // --- Core Logic for Admin Role Assignment ---
        if ("mbongeniroyce@gmail.com".equalsIgnoreCase(dto.getEmail())) {
            user.setRole("ROLE_ADMIN");
        } else {
            // The default role is already set in the User model, but
            // explicitly setting it here can be good practice.
            user.setRole("ROLE_USER");
        }
        // ---------------------------------------------

        User savedUser = userRepository.save(user);
        return toDTO(savedUser);
    }

    public UserDTO loginUser(UserLoginDTO dto) {
        System.out.println("Attempting login for: " + dto.getEmail());
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        System.out.println("User found: " + user.getEmail());
        System.out.println("Stored hash: " + user.getPasswordHash());
        boolean matches = passwordEncoder.matches(dto.getPassword(), user.getPasswordHash());
        System.out.println("Password matches? " + matches);

        if (!matches) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        return toDTO(user);
    }


    public List<UserDTO> listUsers() {
        return userRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public UserDTO getUserById(Long id) {
        return userRepository.findById(id).map(this::toDTO)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setSurname(user.getSurname());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        return dto;
    }
}
