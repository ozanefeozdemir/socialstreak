package com.example.back.mapper;

import com.example.back.dto.HabitSessionRequest;
import com.example.back.dto.HabitSessionRespond;
import com.example.back.model.HabitSession;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface HabitSessionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "habit", ignore = true)
    @Mapping(target = "checkIn", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    HabitSession requestToEntity(HabitSessionRequest request);

    @Mapping(target = "habitId", source = "habit.id")
    @Mapping(target = "checkInId", source = "checkIn.id")
    HabitSessionRespond entityToRespond(HabitSession session);

    List<HabitSessionRespond> entitiesToResponds(List<HabitSession> sessions);
}
