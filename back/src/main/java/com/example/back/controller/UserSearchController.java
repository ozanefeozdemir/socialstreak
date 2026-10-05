package com.example.back.controller;

import com.example.back.dto.UserSearchDto;
import com.example.back.search.model.UserDocument;
import com.example.back.search.service.SearchService;
import com.example.back.security.UserPrincipal;
import com.example.back.service.FriendshipService;
import com.example.back.service.RateLimiterService;
import io.github.bucket4j.Bucket;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Collections;

@RestController
@RequestMapping("/api/user/search")
@RequiredArgsConstructor
public class UserSearchController {

    private final SearchService searchService;
    private final RateLimiterService rateLimiterService;
    private final FriendshipService friendshipService;

    @GetMapping
    public ResponseEntity<List<UserSearchDto>> searchUsers(
            @RequestParam("q") String query,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {

        Bucket bucket = rateLimiterService.resolveBucket(principal.getId().toString());

        if (bucket.tryConsume(1)) {
            // Usually you'd fetch the user's blocked users from the DB here
            List<String> blockedUsers = Collections.emptyList(); 

            List<UserDocument> results = searchService.searchUsers(query, principal.getId().toString(), blockedUsers, page, size);

            List<UUID> validCandidateUuids = results.stream()
                    .map(UserDocument::getId)
                    .filter(id -> {
                        try {
                            UUID.fromString(id);
                            return true;
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .map(UUID::fromString)
                    .collect(Collectors.toList());

            Map<UUID, Integer> mutualFriendsMap = friendshipService.getMutualFriendsCountMap(principal.getId(), validCandidateUuids);

            List<UserSearchDto> dtoList = results.stream().map(doc -> {
                String name = doc.getFullName() != null && doc.getFullName().contains(" ") 
                        ? doc.getFullName().substring(0, doc.getFullName().indexOf(" ")) : (doc.getFullName() != null ? doc.getFullName() : "");
                String surname = doc.getFullName() != null && doc.getFullName().contains(" ") 
                        ? doc.getFullName().substring(doc.getFullName().indexOf(" ") + 1) : "";

                int mutualCount = 0;
                try {
                    UUID userUuid = UUID.fromString(doc.getId());
                    mutualCount = mutualFriendsMap.getOrDefault(userUuid, 0);
                } catch (Exception ignored) {
                }

                return new UserSearchDto(
                        doc.getId(),
                        doc.getUsername(),
                        name,
                        surname,
                        mutualCount
                );
            }).collect(Collectors.toList());

            return ResponseEntity.ok(dtoList);
        }

        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
    }
}
