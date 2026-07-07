package com.example.back.controller;

import com.example.back.dto.ChangePasswordRequest;
import com.example.back.dto.UpdateUserRequest;
import com.example.back.dto.UserRespond;
import com.example.back.exception.UnauthorizedActionException;
import com.example.back.mapper.UserMapper;
import com.example.back.model.User;
import com.example.back.security.UserPrincipal;
import com.example.back.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.server.authentication.HttpStatusServerEntryPoint;
import org.springframework.web.bind.annotation.*;

import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;

    @PreAuthorize("#id == principal.id")
    @GetMapping("/{id}")
    public ResponseEntity<UserRespond> getUserById(@PathVariable UUID id){
        return ResponseEntity.ok(userMapper.userToUserRespond(userService.findUserById(id)));
    }

    @GetMapping
    public ResponseEntity<List<UserRespond>> getAllUsers(){
        return ResponseEntity.ok(userMapper.usersToUserResponds(userService.findAllUsers()));
    }

    @PreAuthorize("#id == principal.id")
    @PutMapping("/{id}")
    public ResponseEntity<UserRespond> updateUser(@PathVariable UUID id, @RequestBody UpdateUserRequest updateUserRequest){
        return ResponseEntity.ok(userMapper.userToUserRespond(userService.updateUser(updateUserRequest, id)));
    }

    @PreAuthorize("#id == principal.id")
    @PatchMapping("/{id}/password")
    public ResponseEntity<Void> changePassword(@PathVariable UUID id, @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(id, request);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("#id == principal.id")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserById(@PathVariable UUID id) {
        userService.deleteUserById(id);
        return ResponseEntity.noContent().build();
    }


}
