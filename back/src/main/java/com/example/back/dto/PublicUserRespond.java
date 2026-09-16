package com.example.back.dto;

import java.util.UUID;

public record PublicUserRespond(
        UUID id,
        String username,
        String name,
        String surname,
        String timezone
) {
}
