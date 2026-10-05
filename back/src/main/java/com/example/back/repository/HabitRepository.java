package com.example.back.repository;

import com.example.back.model.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface HabitRepository extends JpaRepository<Habit, UUID> {
    List<Habit> findByUserId(UUID userId);
    List<Habit> findByUserIdAndArchivedFalse(UUID userId);

    @Query("SELECT LOWER(h.name), COUNT(DISTINCT h.user.id) " +
           "FROM Habit h " +
           "WHERE h.isPublic = true AND h.archived = false " +
           "GROUP BY LOWER(h.name)")
    List<Object[]> countPublicHabitParticipants();
}

