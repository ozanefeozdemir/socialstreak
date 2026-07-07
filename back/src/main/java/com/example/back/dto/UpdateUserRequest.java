package com.example.back.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateUserRequest(
        @NotBlank @Email String email,
        @NotBlank String username,
        @NotBlank String timezone

) {
}
