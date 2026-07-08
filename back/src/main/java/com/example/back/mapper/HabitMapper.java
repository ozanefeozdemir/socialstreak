package com.example.back.mapper;

import com.example.back.dto.HabitRespond;
import com.example.back.model.Habit;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface HabitMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "archived", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Habit requestToEntity(com.example.back.dto.HabitRequest request);

    HabitRespond entityToRespond(Habit habit);
    List<HabitRespond> entitiesToResponds(List<Habit> habits);
}