package com.example.back.dto;

import com.example.back.model.FrequencyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record HabitRequest(
        @NotBlank String name,
        @NotNull FrequencyType frequencyType

) {}