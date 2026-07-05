package com.example.back.repository;

import com.example.back.model.Habit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HabitRepository extends JpaRepository<Habit, UUID> {
    List<Habit> findByUserId(UUID userId);
    List<Habit> findByUserIdAndArchivedFalse(UUID userId);
}
