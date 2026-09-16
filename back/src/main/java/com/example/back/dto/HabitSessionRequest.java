package com.example.back.dto;

import jakarta.validation.constraints.Min;

import java.time.Instant;
import java.util.Map;

public record HabitSessionRequest(
        Instant startedAt,
        Instant endedAt,
        @Min(0) Integer durationSeconds,
        Map<String, Object> sessionData,
        String notes
) {}
