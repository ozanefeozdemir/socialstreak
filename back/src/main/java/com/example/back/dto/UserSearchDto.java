package com.example.back.dto;

import java.util.UUID;

public record UserSearchDto(
        UUID id,
        String username,
        String name,
        String surname,
        Integer mutualFriendsCount
) {
}
