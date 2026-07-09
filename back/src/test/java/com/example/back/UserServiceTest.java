package com.example.back;

import com.example.back.dto.ChangePasswordRequest;
import com.example.back.dto.UpdateUserRequest;
import com.example.back.exception.ResourceNotFoundException;
import com.example.back.exception.UserAlreadyExistsException;
import com.example.back.model.User;
import com.example.back.repository.UserRepository;
import com.example.back.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(testUserId);
        testUser.setEmail("test@example.com");
        testUser.setUsername("testuser");
        testUser.setPasswordHash("hashed_password");
        testUser.setTimezone("UTC");
    }

    @Test
    void findUserByEmail_WhenExists_ShouldReturnUser() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        User result = userService.findUserByEmail("test@example.com");

        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
        verify(userRepository, times(1)).findByEmail("test@example.com");
    }

    @Test
    void findUserByEmail_WhenDoesNotExist_ShouldThrowException() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.findUserByEmail("unknown@example.com"));
        verify(userRepository, times(1)).findByEmail("unknown@example.com");
    }

    @Test
    void deleteUserByEmail_WhenUserExists_ShouldDeleteUser() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        userService.deleteUserByEmail("test@example.com");

        verify(userRepository, times(1)).delete(testUser);
    }

    @Test
    void updateUser_WhenValidRequest_ShouldUpdateAndReturnUser() {
        UpdateUserRequest request = new UpdateUserRequest("new@example.com", "newuser", "GMT+3");
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("newuser")).thenReturn(false);

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User updatedUser = userService.updateUser(request, testUserId);

        assertEquals("new@example.com", updatedUser.getEmail());
        assertEquals("newuser", updatedUser.getUsername());
        assertEquals("GMT+3", updatedUser.getTimezone());
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    void updateUser_WhenEmailAlreadyExists_ShouldThrowException() {
        UpdateUserRequest request = new UpdateUserRequest("existing@example.com", "testuser", "UTC");
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> userService.updateUser(request, testUserId));
        verify(userRepository, never()).save(any(User.class)); // Hata fırlattığı için save asla çağrılmamalı
    }

    @Test
    void changePassword_WhenValid_ShouldUpdatePassword() {
        ChangePasswordRequest request = new ChangePasswordRequest("oldPass", "newPass");
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        when(passwordEncoder.matches("oldPass", "hashed_password")).thenReturn(true);
        when(passwordEncoder.encode("newPass")).thenReturn("new_hashed_password");

        userService.changePassword(testUserId, request);

        assertEquals("new_hashed_password", testUser.getPasswordHash());
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    void changePassword_WhenOldPasswordIsIncorrect_ShouldThrowException() {
        ChangePasswordRequest request = new ChangePasswordRequest("wrongPass", "newPass");
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPass", "hashed_password")).thenReturn(false); // Şifre yanlış eşleşti

        assertThrows(BadCredentialsException.class, () -> userService.changePassword(testUserId, request));
        verify(userRepository, never()).save(any(User.class));
    }
}