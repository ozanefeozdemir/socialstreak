package com.example.back.mapper;

import com.example.back.dto.UserRespond;
import com.example.back.model.User;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserRespond userToUserRespond(User user);
    List<UserRespond> usersToUserResponds(List<User> users);
}
