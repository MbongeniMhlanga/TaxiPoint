package za.co.taxipoint.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import za.co.taxipoint.security.JwtUtil;
import za.co.taxipoint.dto.UserDTO;
import za.co.taxipoint.dto.UserLoginDTO;
import za.co.taxipoint.dto.UserRegisterDTO;
import za.co.taxipoint.dto.UserUpdateDTO;
import za.co.taxipoint.model.User;
import za.co.taxipoint.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // The constructor is now correctly configured for dependency injection.
    // Spring will automatically provide the beans for these parameters.
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
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

        if ("mbongeniroyce@gmail.com".equalsIgnoreCase(dto.getEmail())) {
            user.setRole("ROLE_ADMIN");
        } else {
            user.setRole("ROLE_USER");
        }

        User savedUser = userRepository.save(user);
        return toDTO(savedUser);
    }
    public UserDTO updateUser(Long id, UserUpdateDTO dto) {
    User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    if (dto.getName() != null) user.setName(dto.getName());
    if (dto.getSurname() != null) user.setSurname(dto.getSurname());
    
    if (dto.getEmail() != null && !dto.getEmail().equals(user.getEmail())) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }
        user.setEmail(dto.getEmail());
    }

    if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
        user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
    }

       // New fields
    if (dto.getNotifications() != null) user.setNotifications(dto.getNotifications());
    if (dto.getDarkMode() != null) user.setDarkMode(dto.getDarkMode());

    User saved = userRepository.save(user);
    return toDTO(saved);
}

public void updatePassword(Long id, String oldPassword, String newPassword) {
    User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
        throw new IllegalArgumentException("Old password is incorrect");
    }

    user.setPasswordHash(passwordEncoder.encode(newPassword));
    userRepository.save(user);
}


    public UserDTO loginUser(UserLoginDTO dto) {
        System.out.println("Attempting login for: " + dto.getEmail());
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        System.out.println("User found: " + user.getEmail());
        boolean matches = passwordEncoder.matches(dto.getPassword(), user.getPasswordHash());
        System.out.println("Password matches? " + matches);

        if (!matches) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        System.out.println("Generated token: " + token);

        UserDTO userDTO = toDTO(user);
        userDTO.setToken(token);

        return userDTO;
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
