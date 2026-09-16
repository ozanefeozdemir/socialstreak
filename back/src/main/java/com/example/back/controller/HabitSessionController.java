package com.example.back.controller;

import com.example.back.dto.HabitSessionRequest;
import com.example.back.dto.HabitSessionRespond;
import com.example.back.security.UserPrincipal;
import com.example.back.service.HabitSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/habit")
@RequiredArgsConstructor
public class HabitSessionController {

    private final HabitSessionService habitSessionService;

    @PostMapping("/{habitId}/session")
    public ResponseEntity<HabitSessionRespond> createSession(
            @PathVariable UUID habitId,
            @Valid @RequestBody HabitSessionRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        HabitSessionRespond respond = habitSessionService.createSession(habitId, userPrincipal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(respond);
    }

    @GetMapping("/{habitId}/session")
    public ResponseEntity<List<HabitSessionRespond>> getSessions(
            @PathVariable UUID habitId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return ResponseEntity.ok(habitSessionService.getSessions(habitId, userPrincipal.getId()));
    }

    @DeleteMapping("/{habitId}/session/{sessionId}")
    public ResponseEntity<Void> deleteSession(
            @PathVariable UUID habitId,
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        habitSessionService.deleteSession(habitId, userPrincipal.getId(), sessionId);
        return ResponseEntity.noContent().build();
    }
}
