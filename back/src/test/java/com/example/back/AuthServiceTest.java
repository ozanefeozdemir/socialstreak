package com.example.back;

import com.example.back.dto.AuthRespond;
import com.example.back.dto.LoginRequest;
import com.example.back.dto.RegisterRequest;
import com.example.back.model.RefreshToken;
import com.example.back.model.User;
import com.example.back.repository.RefreshTokenRepository;
import com.example.back.repository.UserRepository;
import com.example.back.security.JwtService;
import com.example.back.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("user@example.com");
        testUser.setUsername("testuser");
        testUser.setPasswordHash("hashed_pw");
    }

    @Test
    void login_ShouldReturnAccessAndRefreshToken() {
        LoginRequest request = new LoginRequest("user@example.com", "password123");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(testUser));
        when(jwtService.generateToken("user@example.com")).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken("user@example.com")).thenReturn("mock-refresh-token");
        when(jwtService.getRefreshExp()).thenReturn(2592000000L);

        AuthRespond response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.token());
        assertEquals("mock-refresh-token", response.refreshToken());
        assertEquals("testuser", response.username());
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    void register_ShouldReturnAccessAndRefreshToken() {
        RegisterRequest request = new RegisterRequest("Name", "Surname", "user@example.com", "pass", "testuser", "UTC");
        when(userRepository.existsByEmail("user@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(passwordEncoder.encode("pass")).thenReturn("hashed_pass");
        when(jwtService.generateToken("user@example.com")).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken("user@example.com")).thenReturn("mock-refresh-token");
        when(jwtService.getRefreshExp()).thenReturn(2592000000L);

        AuthRespond response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.token());
        assertEquals("mock-refresh-token", response.refreshToken());
        verify(userRepository, times(1)).save(any(User.class));
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    void refresh_WithValidToken_ShouldRotateAndReturnNewTokens() {
        String oldRefreshTokenString = "old-refresh-token";
        RefreshToken storedToken = new RefreshToken();
        storedToken.setToken(oldRefreshTokenString);
        storedToken.setUser(testUser);
        storedToken.setExpiresAt(Instant.now().plusSeconds(3600));

        when(jwtService.extractRefreshTokenUsername(oldRefreshTokenString)).thenReturn("user@example.com");
        when(refreshTokenRepository.findByToken(oldRefreshTokenString)).thenReturn(Optional.of(storedToken));
        when(jwtService.generateToken("user@example.com")).thenReturn("new-access-token");
        when(jwtService.generateRefreshToken("user@example.com")).thenReturn("new-refresh-token");
        when(jwtService.getRefreshExp()).thenReturn(2592000000L);

        AuthRespond response = authService.refresh(oldRefreshTokenString);

        assertNotNull(response);
        assertEquals("new-access-token", response.token());
        assertEquals("new-refresh-token", response.refreshToken());
        assertEquals("testuser", response.username());
        // Verify old token was rotated out
        verify(refreshTokenRepository, times(1)).delete(storedToken);
        // Verify new token was saved
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    void refresh_WithNonExistentToken_ShouldThrowBadCredentials() {
        when(jwtService.extractRefreshTokenUsername("unknown-token")).thenReturn("user@example.com");
        when(refreshTokenRepository.findByToken("unknown-token")).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class, () -> authService.refresh("unknown-token"));
    }

    @Test
    void refresh_WithExpiredToken_ShouldDeleteAndThrow() {
        String expiredTokenString = "expired-token";
        RefreshToken expiredToken = new RefreshToken();
        expiredToken.setToken(expiredTokenString);
        expiredToken.setUser(testUser);
        expiredToken.setExpiresAt(Instant.now().minusSeconds(10));

        when(jwtService.extractRefreshTokenUsername(expiredTokenString)).thenReturn("user@example.com");
        when(refreshTokenRepository.findByToken(expiredTokenString)).thenReturn(Optional.of(expiredToken));

        assertThrows(BadCredentialsException.class, () -> authService.refresh(expiredTokenString));
        verify(refreshTokenRepository, times(1)).delete(expiredToken);
    }

    @Test
    void logout_ShouldDeleteToken() {
        authService.logout("mock-refresh-token");

        verify(refreshTokenRepository, times(1)).deleteByToken("mock-refresh-token");
    }
}
