package com.example.back.service;

import com.example.back.dto.HabitSessionRequest;
import com.example.back.dto.HabitSessionRespond;
import com.example.back.exception.ResourceNotFoundException;
import com.example.back.exception.UnauthorizedActionException;
import com.example.back.mapper.HabitSessionMapper;
import com.example.back.model.CheckIn;
import com.example.back.model.Habit;
import com.example.back.model.HabitSession;
import com.example.back.model.HabitType;
import com.example.back.repository.CheckInRepository;
import com.example.back.repository.HabitRepository;
import com.example.back.repository.HabitSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class HabitSessionService {

    private final HabitSessionRepository habitSessionRepository;
    private final CheckInRepository checkInRepository;
    private final HabitRepository habitRepository;
    private final HabitService habitService;
    private final HabitSessionMapper habitSessionMapper;

    @Transactional
    public HabitSessionRespond createSession(UUID habitId, UUID userId, HabitSessionRequest request) {
        Habit habit = habitService.verifyOwnership(habitId, userId);

        // Determine user's local date for check-in
        String tz = habit.getUser().getTimezone();
        LocalDate today;
        try {
            today = (tz != null && !tz.isBlank()) ? LocalDate.now(ZoneId.of(tz)) : LocalDate.now();
        } catch (Exception e) {
            log.warn("Invalid timezone '{}' for user {}, falling back to system default", tz, userId);
            today = LocalDate.now();
        }

        // Find or atomically create CheckIn for today to advance/maintain streak
        LocalDate finalToday = today;
        CheckIn checkIn = checkInRepository.findByHabitIdAndCheckInDate(habitId, finalToday)
                .orElseGet(() -> checkInRepository.save(
                        CheckIn.builder()
                                .habit(habit)
                                .checkInDate(finalToday)
                                .build()
                ));

        Instant started = request.startedAt() != null ? request.startedAt() : Instant.now();
        Instant ended = request.endedAt() != null ? request.endedAt() : Instant.now();

        HabitSession session = HabitSession.builder()
                .habit(habit)
                .checkIn(checkIn)
                .startedAt(started)
                .endedAt(ended)
                .durationSeconds(request.durationSeconds())
                .sessionData(request.sessionData())
                .notes(request.notes())
                .build();

        // If READING habit and endPage provided, advance reading state on habit config
        if (habit.getHabitType() == HabitType.READING && request.sessionData() != null) {
            updateReadingHabitConfig(habit, request);
        }

        HabitSession saved = habitSessionRepository.save(session);
        return habitSessionMapper.entityToRespond(saved);
    }

    private void updateReadingHabitConfig(Habit habit, HabitSessionRequest request) {
        try {
            Map<String, Object> config = habit.getConfig() != null
                    ? new HashMap<>(habit.getConfig())
                    : new HashMap<>();

            Map<String, Object> data = request.sessionData();
            if (data.containsKey("endPage") && data.get("endPage") != null) {
                config.put("currentPage", data.get("endPage"));
            }
            if (data.containsKey("bookTitle") && data.get("bookTitle") != null) {
                String title = String.valueOf(data.get("bookTitle")).trim();
                if (!title.isEmpty()) {
                    config.put("currentBook", title);
                }
            }
            if (data.containsKey("totalPages") && data.get("totalPages") != null) {
                config.put("totalPages", data.get("totalPages"));
            }

            habit.setConfig(config);
            habitRepository.save(habit);
        } catch (Exception e) {
            log.error("Failed to update reading config for habit {}", habit.getId(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<HabitSessionRespond> getSessions(UUID habitId, UUID userId) {
        habitService.verifyOwnership(habitId, userId);
        List<HabitSession> sessions = habitSessionRepository.findByHabitIdOrderByCreatedAtDesc(habitId);
        return habitSessionMapper.entitiesToResponds(sessions);
    }

    @Transactional
    public void deleteSession(UUID habitId, UUID userId, UUID sessionId) {
        habitService.verifyOwnership(habitId, userId);
        HabitSession session = habitSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!session.getHabit().getId().equals(habitId)) {
            throw new UnauthorizedActionException("You are not allowed to delete this session");
        }

        habitSessionRepository.delete(session);
    }
}
