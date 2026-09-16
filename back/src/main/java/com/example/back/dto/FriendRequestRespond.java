package com.example.back.dto;

import java.time.Instant;
import java.util.UUID;

public record FriendRequestRespond(
        UUID id,
        PublicUserRespond sender,
        PublicUserRespond receiver,
        Instant createdAt
) {
}
