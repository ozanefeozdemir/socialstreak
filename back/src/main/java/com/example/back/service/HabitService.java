package com.example.back.service;

import com.example.back.dto.HabitRequest;
import com.example.back.dto.HabitRespond;
import com.example.back.exception.ResourceNotFoundException;
import com.example.back.exception.UnauthorizedActionException;
import com.example.back.mapper.HabitMapper;
import com.example.back.model.Habit;
import com.example.back.model.User;
import com.example.back.repository.HabitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final UserService userService;
    private final HabitMapper habitMapper;

    @Transactional(readOnly = true)
    public HabitRespond findById(UUID habitId, UUID userId){
        Habit habit = verifyOwnership(habitId,userId);
        return habitMapper.entityToRespond(habit);
    }

    @Transactional(readOnly = true)
    public List<HabitRespond> findAllByUserId(UUID userId){
        List<Habit> habits = habitRepository.findByUserId(userId);
        return habitMapper.entitiesToResponds(habits);
    }

    @Transactional
    public HabitRespond create(HabitRequest habitRequest, UUID userId){
        User user = userService.findUserById(userId);
        Habit habit = habitMapper.requestToEntity(habitRequest);
        habit.setUser(user);
        return habitMapper.entityToRespond(habitRepository.save(habit));
    }

    @Transactional
    public HabitRespond  update(UUID habitId, HabitRequest habitRequest, UUID userId){
        Habit habit = verifyOwnership(habitId,userId);

        habit.setName(habitRequest.name());
        habit.setFrequencyType(habitRequest.frequencyType());

        return habitMapper.entityToRespond(habitRepository.save(habit));
    }

    @Transactional
    public HabitRespond archive(UUID habitId, UUID userId){
        Habit habit = verifyOwnership(habitId,userId);
        habit.setArchived(true);
        return habitMapper.entityToRespond(habitRepository.save(habit));
    }

    @Transactional
    public HabitRespond unarchive(UUID habitId, UUID userId){
        Habit habit = verifyOwnership(habitId,userId);
        habit.setArchived(false);
        return habitMapper.entityToRespond(habitRepository.save(habit));
    }

    @Transactional
    public void delete(UUID habitId,  UUID userId){
        Habit habit = verifyOwnership(habitId,userId);
        habitRepository.delete(habit);
    }

    @Transactional
    public Habit verifyOwnership(UUID habitId, UUID userId) {
        //  Cheks existence of habit and associations with user.
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new ResourceNotFoundException("Habit does not exist."));
        if (!habit.getUser().getId().equals(userId)) {
            throw new UnauthorizedActionException("You are not allowed to perform this operation.");
        }
        return habit;
    }

}
