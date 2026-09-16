package com.example.back.dto;

import org.hibernate.annotations.CreationTimestamp;

import java.util.UUID;

public record UserRespond(
        UUID id,
        String email,
        String username,
        String name,
        String surname,
        String timezone,
        Boolean privacySearchable
) {

}
