package com.example.back.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.aspectj.weaver.ast.Not;

import java.io.FilenameFilter;

public record RegisterRequest(
        @NotBlank String name,
        @NotBlank String surname,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8) String password,
        @NotBlank @Size(min = 4, max = 10) String username,
        @NotBlank String timezone
) {
}
