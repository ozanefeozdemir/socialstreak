package com.example.back.controller;
import com.example.back.dto.FriendRequestRespond;


import com.example.back.security.UserPrincipal;
import com.example.back.service.FriendshipRequestService;
import com.example.back.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/friendreq")
public class FriendshipRequestController {
    private final FriendshipRequestService friendshipRequestService;

    @GetMapping("/sent")
    public ResponseEntity<List<FriendRequestRespond>> getAllSentRequests(@AuthenticationPrincipal UserPrincipal user){
        return ResponseEntity
                .ok(friendshipRequestService.findSentRequests(user.getId()));
    }

    @GetMapping("/received")
    public ResponseEntity<List<FriendRequestRespond>> getAllReceivedRequests(@AuthenticationPrincipal UserPrincipal user){
        return ResponseEntity
                .ok(friendshipRequestService.findReceivedRequests(user.getId()));
    }

    @PostMapping("/send/{friendId}")
    public ResponseEntity<FriendRequestRespond> sendRequest(@PathVariable("friendId") UUID friendId, @AuthenticationPrincipal UserPrincipal user){
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(friendshipRequestService.sendRequest(user.getId(), friendId));
    }

    @PostMapping("/accept/{reqId}")
    public ResponseEntity<Void> acceptRequest(@PathVariable("reqId") UUID reqId, @AuthenticationPrincipal UserPrincipal user){
        friendshipRequestService.acceptRequest(reqId, user.getId());
        return ResponseEntity
                .noContent()
                .build();
    }

    @DeleteMapping("/{reqId}")
    public ResponseEntity<Void> deleteRequest(@PathVariable("reqId") UUID reqId, @AuthenticationPrincipal UserPrincipal user){
        friendshipRequestService.removeRequest(reqId, user.getId());
        return ResponseEntity
                .noContent()
                .build();

    }
}
