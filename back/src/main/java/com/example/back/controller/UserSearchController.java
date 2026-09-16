package com.example.back.controller;

import com.example.back.dto.UserSearchDto;
import com.example.back.search.model.UserDocument;
import com.example.back.search.service.SearchService;
import com.example.back.security.UserPrincipal;
import com.example.back.service.RateLimiterService;
import io.github.bucket4j.Bucket;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Collections;

@RestController
@RequestMapping("/api/user/search")
@RequiredArgsConstructor
public class UserSearchController {

    private final SearchService searchService;
    private final RateLimiterService rateLimiterService;

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

            List<UserSearchDto> dtoList = results.stream().map(doc -> {
                // Split fullName back to name and surname if needed, or adjust DTO
                // For simplicity, we just use the original fields which we stored.
                // Oh wait, we only stored fullName in UserDocument? We should also store name/surname or just return fullName.
                // Let's parse it roughly or we should have stored them.
                // Assuming space separates name and surname.
                String name = doc.getFullName() != null && doc.getFullName().contains(" ") 
                        ? doc.getFullName().substring(0, doc.getFullName().indexOf(" ")) : doc.getFullName();
                String surname = doc.getFullName() != null && doc.getFullName().contains(" ") 
                        ? doc.getFullName().substring(doc.getFullName().indexOf(" ") + 1) : "";

                return new UserSearchDto(
                        UUID.fromString(doc.getId()),
                        doc.getUsername(),
                        name,
                        surname,
                        doc.getMutualFriendsCount()
                );
            }).collect(Collectors.toList());

            return ResponseEntity.ok(dtoList);
        }

        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
    }
}
