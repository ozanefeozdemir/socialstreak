package com.example.back.model;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "habits")
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Habit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private FrequencyType frequencyType; // DAILY, WEEKLY, MONTHLY, CUSTOM

    private boolean archived = false;

    @CreationTimestamp
    private Instant createdAt;
}
