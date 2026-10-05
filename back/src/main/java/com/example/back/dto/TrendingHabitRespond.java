package com.example.back.dto;

import com.example.back.model.FrequencyType;
import com.example.back.model.HabitType;

import java.util.Map;

public record TrendingHabitRespond(
        String id,
        String name,
        HabitType habitType,
        String category,
        String icon,
        String color,
        long participantCount,
        long activeStreakCount,
        FrequencyType defaultFrequency,
        String description,
        Map<String, Object> config
) {}
