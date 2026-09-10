package com.example.back.controller;

import com.example.back.dto.FriendshipRespond;
import com.example.back.security.UserPrincipal;
import com.example.back.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/friendship")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService friendshipService;

    @GetMapping
    public ResponseEntity<List<FriendshipRespond>> getFriendships(@AuthenticationPrincipal UserPrincipal user){
        return ResponseEntity.ok(friendshipService.findAllFriends(user.getId()));
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<Void> deleteFriendship(@AuthenticationPrincipal UserPrincipal user, @PathVariable UUID friendId){
        friendshipService.deleteFriend(user.getId(), friendId);
        return ResponseEntity.noContent().build();
    }
}
