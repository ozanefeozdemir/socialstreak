package com.example.back.messaging;

import com.example.back.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RabbitMQProducer {

    private final RabbitTemplate rabbitTemplate;

    public void publishUserSyncEvent(String eventType, Object userPayload) {
        // e.g. eventType: user.created, user.updated
        log.info("Publishing user sync event: {}", eventType);
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, eventType, userPayload);
    }

    public void publishCheckInEvent(Object checkInPayload) {
        log.info("Publishing check-in event");
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.ROUTING_KEY_FEED, checkInPayload);
    }
}
