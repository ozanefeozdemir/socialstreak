package com.example.back.dto;

import com.example.back.model.Habit;

import java.time.LocalDate;
import java.util.UUID;

public record CheckInRespond(
        UUID id,
        UUID habitId,
        LocalDate checkInDate
) {
}
