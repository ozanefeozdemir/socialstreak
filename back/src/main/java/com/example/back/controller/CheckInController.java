package com.example.back.controller;

import com.example.back.dto.CheckInRespond;
import com.example.back.security.UserPrincipal;
import com.example.back.service.CheckInService;
import com.example.back.service.HabitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/habit")
@RequiredArgsConstructor
public class CheckInController {

    private final CheckInService checkInService;

    @PostMapping("/{habitId}/checkin")
    public ResponseEntity<CheckInRespond> checkIn(@PathVariable UUID habitId, @AuthenticationPrincipal UserPrincipal userPrincipal){
        return ResponseEntity.ok(checkInService.checkIn(habitId, userPrincipal.getId()));
    }

    @GetMapping("/{habitId}/checkin")
    public ResponseEntity<List<CheckInRespond>> getCheckInList(@PathVariable UUID habitId,  @AuthenticationPrincipal UserPrincipal userPrincipal){
        return ResponseEntity.ok(checkInService.checkInList(habitId, userPrincipal.getId()));
    }

    @DeleteMapping("/{habitId}/checkin/{checkInId}")
    public ResponseEntity<Void> deleteCheckIn(@PathVariable UUID checkInId, @AuthenticationPrincipal UserPrincipal userPrincipal,@PathVariable UUID habitId){
        checkInService.delete(habitId, userPrincipal.getId(), checkInId);
        return ResponseEntity.noContent().build();
    }
}

