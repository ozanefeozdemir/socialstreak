package com.example.back.repository;

import com.example.back.model.CheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CheckInRepository extends JpaRepository<CheckIn, UUID> {

    List<CheckIn> findByHabitIdOrderByCheckInDateDesc(UUID habitId);
    Optional<CheckIn>  findByHabitIdAndCheckInDate(UUID habitId, LocalDate checkInDate);
    boolean existsByHabitIdAndCheckInDate(UUID habitId, LocalDate checkInDate);
}
