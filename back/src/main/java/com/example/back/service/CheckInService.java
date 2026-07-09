package com.example.back.service;

import ch.qos.logback.classic.html.DefaultThrowableRenderer;
import com.example.back.dto.CheckInRespond;
import com.example.back.exception.DuplicateCheckInException;
import com.example.back.exception.ResourceNotFoundException;
import com.example.back.exception.UnauthorizedActionException;
import com.example.back.mapper.CheckInMapper;
import com.example.back.model.CheckIn;
import com.example.back.model.Habit;
import com.example.back.repository.CheckInRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CheckInService {

    private final CheckInRepository checkInRepository;
    private final CheckInMapper checkInMapper;
    private final HabitService habitService;

    @Transactional
    public CheckInRespond checkIn(UUID habitId, UUID userId){
        Habit habit = habitService.verifyOwnership(habitId,userId);
        LocalDate date = LocalDate.now(ZoneId.of(habit.getUser().getTimezone()));
        if(checkInRepository.existsByHabitIdAndCheckInDate(habitId,date)){
            throw new DuplicateCheckInException("You already have this check in");
        }
        CheckIn checkIn = CheckIn.builder()
                .checkInDate(date)
                .habit(habit)
                .build();
        return checkInMapper.entityToRespond(checkInRepository.save(checkIn));
    }

    @Transactional(readOnly = true)
    public List<CheckInRespond> checkInList(UUID habitId, UUID userId){
        Habit habit = habitService.verifyOwnership(habitId,userId);
        return checkInMapper.entityToResponds(checkInRepository.findByHabitIdOrderByCheckInDateDesc(habitId));
    }

    @Transactional
    public void delete(UUID habitId, UUID userId, UUID checkInId){
        Habit habit = habitService.verifyOwnership(habitId,userId);
        CheckIn checkIn = checkInRepository.findById(checkInId)
                .orElseThrow(() -> new ResourceNotFoundException("CheckIn not found"));
        if(!checkIn.getHabit().getId().equals(habitId))
            throw new UnauthorizedActionException("You are not allowed to delete this check in");
        checkInRepository.delete(checkIn);
    }

}
