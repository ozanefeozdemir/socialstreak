package com.example.back.mapper;

import com.example.back.dto.HabitRequest;
import com.example.back.dto.HabitRespond;
import com.example.back.model.Habit;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface HabitMapper {

    @Mapping(target = "user", ignore = true)
    @Mapping(target = "archived", ignore = true)
    Habit requestToEntity(HabitRequest request);

    HabitRespond entityToRespond(Habit habit);
    List<HabitRespond> entitiesToResponds(List<Habit> habits);
}