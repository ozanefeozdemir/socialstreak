package com.example.back.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Getter
@Setter
@Data
@Table(name = "check_ins", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"habit_id", "check_in_date"})
})
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckIn {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habit_id",  nullable = false)
    private Habit habit;

    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @CreationTimestamp
    private Instant createdAt;
}
