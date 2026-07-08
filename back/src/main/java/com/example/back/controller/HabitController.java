package com.example.back.controller;

import com.example.back.dto.HabitRequest;
import com.example.back.dto.HabitRespond;
import com.example.back.mapper.HabitMapper;
import com.example.back.model.Habit;
import com.example.back.security.UserPrincipal;
import com.example.back.service.HabitService;
import com.example.back.service.UserService;
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
public class HabitController {

    private final HabitService habitService;

    @GetMapping
    public ResponseEntity<List<HabitRespond>> getHabitByUserId(@AuthenticationPrincipal UserPrincipal userPrincipal){
        List<HabitRespond> habits = habitService.findAllByUserId(userPrincipal.getId());
        return ResponseEntity.ok(habits);
    }

    @GetMapping("/{id}")
    public ResponseEntity<HabitRespond> getHabitById(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal userPrincipal){
        return ResponseEntity.ok(habitService.findById(id, userPrincipal.getId()));
    }

    @PostMapping
    public ResponseEntity<HabitRespond> create(@Valid @RequestBody HabitRequest habitRequest, @AuthenticationPrincipal UserPrincipal userPrincipal){
        return ResponseEntity.status(HttpStatus.CREATED).body(habitService.create(habitRequest, userPrincipal.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HabitRespond> update(@PathVariable UUID id, @Valid @RequestBody HabitRequest habitRequest, @AuthenticationPrincipal UserPrincipal userPrincipal){
        return ResponseEntity.ok(habitService.update(id, habitRequest, userPrincipal.getId()));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<HabitRespond> archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal userPrincipal){
        return ResponseEntity.ok(habitService.archive(id, userPrincipal.getId()));
    }

    @PatchMapping("/{id}/unarchive")
    public ResponseEntity<HabitRespond> unarchive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal userPrincipal){
        return ResponseEntity.ok(habitService.unarchive(id, userPrincipal.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,  @AuthenticationPrincipal UserPrincipal userPrincipal){
        habitService.delete(id, userPrincipal.getId());
        return ResponseEntity.noContent().build();
    }   
}
