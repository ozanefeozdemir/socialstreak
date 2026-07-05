package com.example.back.dto;

import com.example.back.model.FrequencyType;

import java.time.Instant;
import java.util.UUID;

public record HabitRespond(
        UUID id,
        String name,
        FrequencyType frequencyType,
        boolean archived,
        Instant createdAt
) {}