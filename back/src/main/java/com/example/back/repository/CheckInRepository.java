package com.example.back.repository;

import com.example.back.model.CheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CheckInRepository extends JpaRepository<CheckIn, UUID> {

    List<CheckIn> findByHabitIdOrderByCheckInDateDesc(UUID habitId);
    Optional<CheckIn> findByHabitIdAndCheckInDate(UUID habitId, LocalDate checkInDate);
    boolean existsByHabitIdAndCheckInDate(UUID habitId, LocalDate checkInDate);

    @Query("SELECT c FROM CheckIn c JOIN FETCH c.habit h JOIN FETCH h.user u WHERE h.user.id IN :userIds AND h.archived = false ORDER BY c.createdAt DESC")
    List<CheckIn> findFeedCheckInsByUserIds(@Param("userIds") List<UUID> userIds);
}
