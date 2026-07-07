package com.example.back.service;

import com.example.back.dto.AuthRespond;
import com.example.back.dto.LoginRequest;
import com.example.back.dto.RegisterRequest;
import com.example.back.exception.UserAlreadyExistsException;
import com.example.back.model.User;
import com.example.back.repository.UserRepository;
import com.example.back.security.JwtService;
import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;


    public AuthRespond login(LoginRequest request){

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email()).orElseThrow(() ->
                new UsernameNotFoundException(("Email is not registered: " + request.email())));

        String token = jwtService.generateToken(request.email());
        return new AuthRespond(token, user.getUsername());
    }

    public AuthRespond register(RegisterRequest request){

        if(userRepository.existsByEmail(request.email()) || userRepository.existsByUsername(request.username())){
            throw new UserAlreadyExistsException("User Already Exists.");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setUsername(request.username());
        user.setTimezone(request.timezone());

        userRepository.save(user);

        String token = jwtService.generateToken(request.email());
        return new AuthRespond(token, user.getUsername());
    }

}
