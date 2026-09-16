package com.example.back.repository;

import com.example.back.model.HabitSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HabitSessionRepository extends JpaRepository<HabitSession, UUID> {

    List<HabitSession> findByHabitIdOrderByStartedAtDesc(UUID habitId);

    List<HabitSession> findByHabitIdOrderByCreatedAtDesc(UUID habitId);

    List<HabitSession> findByCheckInId(UUID checkInId);

    Optional<HabitSession> findFirstByCheckInIdOrderByCreatedAtDesc(UUID checkInId);

    List<HabitSession> findByCheckInIdIn(List<UUID> checkInIds);
}
