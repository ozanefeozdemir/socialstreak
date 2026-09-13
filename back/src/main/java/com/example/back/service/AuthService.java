package com.example.back.service;

import com.example.back.dto.AuthRespond;
import com.example.back.dto.LoginRequest;
import com.example.back.dto.RegisterRequest;
import com.example.back.exception.UserAlreadyExistsException;
import com.example.back.model.RefreshToken;
import com.example.back.model.User;
import com.example.back.repository.RefreshTokenRepository;
import com.example.back.repository.UserRepository;
import com.example.back.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthRespond login(LoginRequest request){
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email()).orElseThrow(() ->
                new UsernameNotFoundException("Email is not registered: " + request.email()));

        String accessToken = jwtService.generateToken(user.getEmail());
        String refreshToken = createAndSaveRefreshToken(user);
        return new AuthRespond(accessToken, refreshToken, user.getUsername());
    }

    @Transactional
    public AuthRespond register(RegisterRequest request){
        if(userRepository.existsByEmail(request.email()) || userRepository.existsByUsername(request.username())){
            throw new UserAlreadyExistsException("User Already Exists.");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setUsername(request.username());
        user.setTimezone(request.timezone());
        user.setName(request.name());
        user.setSurname(request.surname());

        userRepository.save(user);

        String accessToken = jwtService.generateToken(user.getEmail());
        String refreshToken = createAndSaveRefreshToken(user);
        return new AuthRespond(accessToken, refreshToken, user.getUsername());
    }

    @Transactional
    public AuthRespond refresh(String requestRefreshToken) {
        if (requestRefreshToken == null || requestRefreshToken.isBlank()) {
            throw new BadCredentialsException("Refresh token cannot be blank");
        }

        // 1. Verify token signature & expiry claim via JWT parser
        String email;
        try {
            email = jwtService.extractRefreshTokenUsername(requestRefreshToken);
        } catch (Exception ex) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        // 2. Check token exists in database (not revoked)
        RefreshToken storedToken = refreshTokenRepository.findByToken(requestRefreshToken)
                .orElseThrow(() -> new BadCredentialsException("Refresh token is invalid or has been revoked"));

        // 3. Check DB expiry
        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(storedToken);
            throw new BadCredentialsException("Refresh token has expired");
        }

        User user = storedToken.getUser();
        if (!user.getEmail().equalsIgnoreCase(email)) {
            refreshTokenRepository.delete(storedToken);
            throw new BadCredentialsException("Token user mismatch");
        }

        // 4. Token rotation: delete old refresh token
        refreshTokenRepository.delete(storedToken);

        // 5. Generate new access token and new refresh token
        String newAccessToken = jwtService.generateToken(user.getEmail());
        String newRefreshToken = createAndSaveRefreshToken(user);

        return new AuthRespond(newAccessToken, newRefreshToken, user.getUsername());
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenRepository.deleteByToken(refreshToken);
        }
    }

    private String createAndSaveRefreshToken(User user) {
        String tokenString = jwtService.generateRefreshToken(user.getEmail());
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(tokenString);
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(Instant.now().plusMillis(jwtService.getRefreshExp()));
        refreshTokenRepository.save(refreshToken);
        return tokenString;
    }
}
