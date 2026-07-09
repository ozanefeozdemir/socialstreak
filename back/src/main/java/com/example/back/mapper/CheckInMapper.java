package com.example.back.mapper;

import com.example.back.dto.CheckInRespond;
import com.example.back.model.CheckIn;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CheckInMapper {
    @Mapping(target = "habitId", source = "habit.id")
    CheckInRespond entityToRespond(CheckIn checkIn);
    List<CheckInRespond> entityToResponds(List<CheckIn> checkInList);
}
