package com.example.back.model;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "habit_type", nullable = false)
    @org.hibernate.annotations.ColumnDefault("'GENERAL'")
    private HabitType habitType = HabitType.GENERAL;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "config", columnDefinition = "jsonb")
    private java.util.Map<String, Object> config;

    private boolean archived = false;

    @Column(nullable = false)
    @ColumnDefault("true")
    private Boolean isPublic = true;

    @CreationTimestamp
    private Instant createdAt;
}
