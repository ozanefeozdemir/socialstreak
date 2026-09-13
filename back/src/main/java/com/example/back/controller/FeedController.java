package com.example.back.controller;

import com.example.back.dto.FeedItemRespond;
import com.example.back.security.UserPrincipal;
import com.example.back.service.FeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/feed")
@RequiredArgsConstructor
public class FeedController {

    private final FeedService feedService;

    @GetMapping
    public ResponseEntity<List<FeedItemRespond>> getFeed(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(feedService.getFeed(userPrincipal.getId()));
    }
}
