package com.example.back.service;

import com.example.back.model.User;
import com.example.back.repository.UserRepository;
import com.example.back.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        User user;
        try {
            java.util.UUID id = java.util.UUID.fromString(identifier);
            user = userRepository.findById(id)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));
        } catch (IllegalArgumentException e) {
            user = userRepository.findByEmail(identifier)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + identifier));
        }
        return new UserPrincipal(user);
    }
}