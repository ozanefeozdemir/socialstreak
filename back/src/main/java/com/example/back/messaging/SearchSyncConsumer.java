package com.example.back.messaging;

import com.example.back.config.RabbitMQConfig;
import com.example.back.messaging.payload.UserSyncPayload;
import com.example.back.search.model.UserDocument;
import com.example.back.search.repository.UserSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchSyncConsumer {

    private final UserSearchRepository userSearchRepository;

    @RabbitListener(queues = RabbitMQConfig.SEARCH_SYNC_QUEUE)
    public void handleUserSyncEvent(UserSyncPayload payload) {
        log.info("Received user sync event for user: {}", payload.getId());
        
        Optional<UserDocument> existingDocOpt = userSearchRepository.findById(payload.getId().toString());
        
        UserDocument doc = existingDocOpt.orElseGet(() -> UserDocument.builder()
                .id(payload.getId().toString())
                // new users will start with 0 mutual friends, we can calculate it later or in a separate event
                .mutualFriendsCount(0) 
                .build());

        doc.setUsername(payload.getUsername());
        doc.setFullName(payload.getName() + " " + payload.getSurname());
        doc.setPrivacySearchable(payload.getPrivacySearchable());
        
        userSearchRepository.save(doc);
        log.info("User {} indexed successfully.", payload.getId());
    }
}
