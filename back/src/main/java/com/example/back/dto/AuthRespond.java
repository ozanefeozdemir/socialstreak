package com.example.back.dto;

public record AuthRespond(
        String token,
        String refreshToken,
        UserRespond user
) {
}
