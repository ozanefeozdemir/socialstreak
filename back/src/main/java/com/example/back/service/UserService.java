package com.example.back.service;

import com.example.back.dto.ChangePasswordRequest;
import com.example.back.dto.UpdateUserRequest;
import com.example.back.exception.ResourceNotFoundException;
import com.example.back.exception.UserAlreadyExistsException;
import com.example.back.model.User;
import com.example.back.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User findUserByEmail(String email){
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("This email does not exist."));
    }

    public void deleteUserByEmail(String email){
        User user= userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("This email does not exist."));
        userRepository.delete(user);
    }

    public User findUserById(UUID id){
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("This id does not exist."));
    }

    public void deleteUserById(UUID id){
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("This id does not exist."));
        userRepository.delete(user);
    }

    public User updateUser(UpdateUserRequest newUser, UUID id){
        User updateUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("This id does not exist."));

        if(updateUser.getEmail().equals(newUser.email())
                && userRepository.existsByEmail(newUser.email())){
            throw new UserAlreadyExistsException("This email already exists.");
        }

        if(updateUser.getUsername().equals(newUser.username())
        && userRepository.existsByUsername(newUser.username())){
            throw new UserAlreadyExistsException("This username already exists.");
        }

        updateUser.setEmail(newUser.email());
        updateUser.setUsername(newUser.username());
        updateUser.setTimezone(newUser.timezone());

        return userRepository.save(updateUser);
    }

    public void changePassword(UUID id, ChangePasswordRequest changePasswordRequest){
            User user =  userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("This id does not exist."));

            if(!passwordEncoder.matches(changePasswordRequest.currentPassword(), user.getPasswordHash()))
                throw new BadCredentialsException("Passwords don't match.");

            user.setPasswordHash(passwordEncoder.encode(changePasswordRequest.newPassword()));
            userRepository.save(user);
    }

    public List<User> findAllUsers() {
        return userRepository.findAll();
    }
}
