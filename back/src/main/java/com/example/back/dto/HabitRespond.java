package com.example.back.dto;

import com.example.back.model.FrequencyType;
import com.example.back.model.HabitType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record HabitRespond(
        UUID id,
        String name,
        FrequencyType frequencyType,
        HabitType habitType,
        Map<String, Object> config,
        boolean archived,
        Boolean isPublic,
        Instant createdAt
) {}