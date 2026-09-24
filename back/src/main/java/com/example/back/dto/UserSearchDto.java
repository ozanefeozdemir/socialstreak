package com.example.back.dto;

public record UserSearchDto(
        String id,
        String username,
        String name,
        String surname,
        Integer mutualFriendsCount
) {
}
