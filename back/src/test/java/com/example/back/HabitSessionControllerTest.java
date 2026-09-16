package com.example.back;

import com.example.back.controller.HabitSessionController;
import com.example.back.dto.HabitSessionRequest;
import com.example.back.dto.HabitSessionRespond;
import com.example.back.model.User;
import com.example.back.security.UserPrincipal;
import com.example.back.service.HabitSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class HabitSessionControllerTest {

    private MockMvc mockMvc;

    @Mock
    private HabitSessionService habitSessionService;

    @InjectMocks
    private HabitSessionController habitSessionController;

    private final UUID testUserId = UUID.randomUUID();
    private final UUID testHabitId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        User user = new User();
        user.setId(testUserId);
        user.setEmail("test@example.com");
        user.setName("Test");
        user.setSurname("User");
        user.setTimezone("UTC");
        UserPrincipal principal = new UserPrincipal(user);

        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(UserPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return principal;
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(habitSessionController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .build();
    }

    @Test
    void createSession_withComplexSessionData_deserializesAndReturns201() throws Exception {
        UUID sessionId = UUID.randomUUID();
        HabitSessionRespond mockResponse = new HabitSessionRespond(
                sessionId,
                testHabitId,
                UUID.randomUUID(),
                Instant.now(),
                Instant.now(),
                1800,
                Map.of("bodyParts", java.util.List.of("CHEST", "SHOULDERS"), "intensity", "MODERATE"),
                "Great session",
                Instant.now()
        );

        when(habitSessionService.createSession(eq(testHabitId), eq(testUserId), any(HabitSessionRequest.class)))
                .thenReturn(mockResponse);

        String jsonPayload = """
                {
                    "durationSeconds": 1800,
                    "sessionData": {
                        "bodyParts": ["CHEST", "SHOULDERS"],
                        "intensity": "MODERATE"
                    },
                    "notes": "Great session"
                }
                """;

        mockMvc.perform(post("/api/habit/{habitId}/session", testHabitId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(sessionId.toString()))
                .andExpect(jsonPath("$.durationSeconds").value(1800))
                .andExpect(jsonPath("$.sessionData.intensity").value("MODERATE"))
                .andExpect(jsonPath("$.notes").value("Great session"));
    }
}
