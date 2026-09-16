package com.example.back.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record FeedItemRespond(
        UUID id,
        LocalDate checkInDate,
        Instant createdAt,
        UserRespond user,
        HabitRespond habit,
        int streak,
        HabitSessionRespond session
) {}
