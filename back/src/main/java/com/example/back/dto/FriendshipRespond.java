package com.example.back.dto;

import org.springframework.web.servlet.view.FragmentsRendering;

import java.time.Instant;
import java.util.UUID;

public record FriendshipRespond(
        UUID id,
        UserRespond friend,
        Instant createdAt
) {
}
