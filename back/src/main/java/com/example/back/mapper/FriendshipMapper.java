package com.example.back.mapper;

import com.example.back.dto.FriendRequestRespond;
import com.example.back.dto.FriendshipRespond;
import com.example.back.model.FriendRequest;
import com.example.back.model.Friendship;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface FriendshipMapper {
    FriendshipRespond friendshipToRespond(Friendship friendship);
    List<FriendRequestRespond> friendRequestsToResponds(List<FriendRequest> friendRequests);

    FriendRequestRespond friendRequestToRespond(FriendRequest friendRequest);
    List<FriendshipRespond> friendshipsToResponds(List<Friendship> friendships);
}
