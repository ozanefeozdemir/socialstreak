package com.example.back.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record HabitSessionRespond(
        UUID id,
        UUID habitId,
        UUID checkInId,
        Instant startedAt,
        Instant endedAt,
        Integer durationSeconds,
        Map<String, Object> sessionData,
        String notes,
        Instant createdAt
) {}
