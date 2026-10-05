package com.example.back.search.service;

import com.example.back.model.User;
import com.example.back.repository.UserRepository;
import com.example.back.search.model.UserDocument;
import com.example.back.search.repository.UserSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserSearchSyncService {

    private final UserRepository userRepository;
    private final UserSearchRepository userSearchRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void syncMissingUsersToElasticsearch() {
        try {
            List<User> dbUsers = userRepository.findAll();
            int syncedCount = 0;
            for (User u : dbUsers) {
                if (!userSearchRepository.existsById(u.getId().toString())) {
                    UserDocument doc = UserDocument.builder()
                            .id(u.getId().toString())
                            .username(u.getUsername())
                            .fullName((u.getName() != null ? u.getName() : "") + " " + (u.getSurname() != null ? u.getSurname() : ""))
                            .mutualFriendsCount(0)
                            .privacySearchable(u.getPrivacySearchable() != null ? u.getPrivacySearchable() : true)
                            .build();
                    userSearchRepository.save(doc);
                    syncedCount++;
                }
            }
            if (syncedCount > 0) {
                log.info("Synced {} existing PostgreSQL users into Elasticsearch index.", syncedCount);
            }
        } catch (Exception e) {
            log.warn("Could not sync users to Elasticsearch on startup: {}", e.getMessage());
        }
    }
}
