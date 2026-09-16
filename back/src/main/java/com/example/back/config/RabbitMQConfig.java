package com.example.back.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "socialstreak.events";
    
    // Queues
    public static final String SEARCH_SYNC_QUEUE = "q.search.user.sync";
    public static final String FEED_GENERATOR_QUEUE = "q.feed.generator";
    public static final String NOTIFICATION_PUSH_QUEUE = "q.notification.push";

    // Routing Keys
    public static final String ROUTING_KEY_USER_SYNC = "user.#";
    public static final String ROUTING_KEY_FEED = "habit.checkin.created";
    public static final String ROUTING_KEY_NOTIFICATION_CHECKIN = "habit.checkin.created";
    public static final String ROUTING_KEY_NOTIFICATION_FRIEND = "friend.request.#";

    @Bean
    public TopicExchange eventExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue searchSyncQueue() {
        return new Queue(SEARCH_SYNC_QUEUE, true);
    }

    @Bean
    public Queue feedGeneratorQueue() {
        return new Queue(FEED_GENERATOR_QUEUE, true);
    }

    @Bean
    public Queue notificationPushQueue() {
        return new Queue(NOTIFICATION_PUSH_QUEUE, true);
    }

    @Bean
    public Binding searchSyncBinding(Queue searchSyncQueue, TopicExchange eventExchange) {
        return BindingBuilder.bind(searchSyncQueue).to(eventExchange).with(ROUTING_KEY_USER_SYNC);
    }

    @Bean
    public Binding feedGeneratorBinding(Queue feedGeneratorQueue, TopicExchange eventExchange) {
        return BindingBuilder.bind(feedGeneratorQueue).to(eventExchange).with(ROUTING_KEY_FEED);
    }

    @Bean
    public Binding notificationPushBindingCheckin(Queue notificationPushQueue, TopicExchange eventExchange) {
        return BindingBuilder.bind(notificationPushQueue).to(eventExchange).with(ROUTING_KEY_NOTIFICATION_CHECKIN);
    }

    @Bean
    public Binding notificationPushBindingFriend(Queue notificationPushQueue, TopicExchange eventExchange) {
        return BindingBuilder.bind(notificationPushQueue).to(eventExchange).with(ROUTING_KEY_NOTIFICATION_FRIEND);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
