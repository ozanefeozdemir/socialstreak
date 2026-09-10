package com.example.back.service;

import com.example.back.dto.FriendshipRespond;
import com.example.back.exception.ResourceNotFoundException;
import com.example.back.mapper.FriendshipMapper;
import com.example.back.model.Friendship;
import com.example.back.model.User;
import com.example.back.repository.FriendshipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final FriendshipRequestService friendshipRequestService;
    private final UserService userService;
    private final FriendshipMapper friendshipMapper;

    @Transactional(readOnly = true)
    public List<FriendshipRespond> findAllFriends(UUID userId){
        User user = userService.findUserById(userId);
        List<Friendship> friendships = friendshipRepository.findByUserId(userId);

        return friendshipMapper.friendshipsToResponds(friendships);
    }

    @Transactional
    public void deleteFriend(UUID userId, UUID friendId){
        if(friendshipRepository.existsByUserIdAndFriendId(userId,friendId)){
            friendshipRepository.deleteFriendshipBetweenUsers(userId,friendId);
        }else throw new ResourceNotFoundException("Böyle bir arkadaşlık yok.");
    }
}
