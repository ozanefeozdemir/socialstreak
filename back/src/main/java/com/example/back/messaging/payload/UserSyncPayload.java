package com.example.back.messaging.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSyncPayload {
    private UUID id;
    private String username;
    private String name;
    private String surname;
    private Boolean privacySearchable;
}
