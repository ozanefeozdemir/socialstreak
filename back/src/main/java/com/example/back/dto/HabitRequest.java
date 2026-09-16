package com.example.back.dto;
 
import com.example.back.model.FrequencyType;
import com.example.back.model.HabitType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
 
import java.util.Map;
 
public record HabitRequest(
        @NotBlank String name,
        @NotNull FrequencyType frequencyType,
        HabitType habitType,
        Map<String, Object> config,
        Boolean isPublic
) {}