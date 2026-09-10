package com.example.back.dto;

import java.time.Instant;
import java.util.UUID;

public record FriendRequestRespond(
        UUID id,
        UserRespond sender,
        UserRespond receiver,
        Instant createdAt
) {
}
