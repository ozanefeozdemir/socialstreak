package com.example.back;

import com.example.back.dto.HabitSessionRequest;
import com.example.back.dto.HabitSessionRespond;
import com.example.back.exception.UnauthorizedActionException;
import com.example.back.mapper.HabitSessionMapper;
import com.example.back.model.*;
import com.example.back.repository.CheckInRepository;
import com.example.back.repository.HabitRepository;
import com.example.back.repository.HabitSessionRepository;
import com.example.back.service.HabitService;
import com.example.back.service.HabitSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HabitSessionServiceTest {

    @Mock
    private HabitSessionRepository habitSessionRepository;

    @Mock
    private CheckInRepository checkInRepository;

    @Mock
    private HabitRepository habitRepository;

    @Mock
    private HabitService habitService;

    @Mock
    private HabitSessionMapper habitSessionMapper;

    @InjectMocks
    private HabitSessionService habitSessionService;

    private User testUser;
    private Habit testHabit;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setTimezone("UTC");

        testHabit = new Habit();
        testHabit.setId(UUID.randomUUID());
        testHabit.setName("Morning Workout");
        testHabit.setHabitType(HabitType.WORKOUT);
        testHabit.setUser(testUser);
        testHabit.setFrequencyType(FrequencyType.DAILY);
    }

    @Test
    void createSession_createsCheckInWhenNoneExists() {
        Map<String, Object> sessionData = Map.of("bodyParts", List.of("CHEST", "SHOULDERS"));

        HabitSessionRequest request = new HabitSessionRequest(
                Instant.now(),
                Instant.now(),
                3600,
                sessionData,
                "Great chest day"
        );

        CheckIn newCheckIn = CheckIn.builder()
                .id(UUID.randomUUID())
                .habit(testHabit)
                .checkInDate(LocalDate.now())
                .build();

        HabitSession savedSession = HabitSession.builder()
                .id(UUID.randomUUID())
                .habit(testHabit)
                .checkIn(newCheckIn)
                .durationSeconds(3600)
                .sessionData(sessionData)
                .build();

        HabitSessionRespond expectedResponse = new HabitSessionRespond(
                savedSession.getId(),
                testHabit.getId(),
                newCheckIn.getId(),
                savedSession.getStartedAt(),
                savedSession.getEndedAt(),
                3600,
                sessionData,
                "Great chest day",
                Instant.now()
        );

        when(habitService.verifyOwnership(testHabit.getId(), testUser.getId())).thenReturn(testHabit);
        when(checkInRepository.findByHabitIdAndCheckInDate(eq(testHabit.getId()), any(LocalDate.class)))
                .thenReturn(Optional.empty());
        when(checkInRepository.save(any(CheckIn.class))).thenReturn(newCheckIn);
        when(habitSessionRepository.save(any(HabitSession.class))).thenReturn(savedSession);
        when(habitSessionMapper.entityToRespond(savedSession)).thenReturn(expectedResponse);

        HabitSessionRespond result = habitSessionService.createSession(testHabit.getId(), testUser.getId(), request);

        assertNotNull(result);
        assertEquals(expectedResponse.id(), result.id());
        verify(checkInRepository, times(1)).save(any(CheckIn.class));
        verify(habitSessionRepository, times(1)).save(any(HabitSession.class));
    }

    @Test
    void createSession_reusesExistingCheckIn() {
        Map<String, Object> sessionData = Map.of("distanceKm", 5.2);

        HabitSessionRequest request = new HabitSessionRequest(
                Instant.now(),
                Instant.now(),
                1800,
                sessionData,
                "Park run"
        );

        CheckIn existingCheckIn = CheckIn.builder()
                .id(UUID.randomUUID())
                .habit(testHabit)
                .checkInDate(LocalDate.now())
                .build();

        HabitSession savedSession = HabitSession.builder()
                .id(UUID.randomUUID())
                .habit(testHabit)
                .checkIn(existingCheckIn)
                .durationSeconds(1800)
                .sessionData(sessionData)
                .build();

        when(habitService.verifyOwnership(testHabit.getId(), testUser.getId())).thenReturn(testHabit);
        when(checkInRepository.findByHabitIdAndCheckInDate(eq(testHabit.getId()), any(LocalDate.class)))
                .thenReturn(Optional.of(existingCheckIn));
        when(habitSessionRepository.save(any(HabitSession.class))).thenReturn(savedSession);
        when(habitSessionMapper.entityToRespond(savedSession)).thenReturn(mock(HabitSessionRespond.class));

        HabitSessionRespond result = habitSessionService.createSession(testHabit.getId(), testUser.getId(), request);

        assertNotNull(result);
        verify(checkInRepository, never()).save(any(CheckIn.class));
        verify(habitSessionRepository, times(1)).save(any(HabitSession.class));
    }

    @Test
    void createSession_readingHabit_updatesConfigWithEndPage() {
        testHabit.setHabitType(HabitType.READING);
        Map<String, Object> sessionData = Map.of(
                "bookTitle", "Atomic Habits",
                "endPage", 178
        );

        HabitSessionRequest request = new HabitSessionRequest(
                Instant.now(),
                Instant.now(),
                2400,
                sessionData,
                "Chapter 4"
        );

        CheckIn checkIn = CheckIn.builder().id(UUID.randomUUID()).habit(testHabit).checkInDate(LocalDate.now()).build();
        HabitSession savedSession = HabitSession.builder().id(UUID.randomUUID()).habit(testHabit).build();

        when(habitService.verifyOwnership(testHabit.getId(), testUser.getId())).thenReturn(testHabit);
        when(checkInRepository.findByHabitIdAndCheckInDate(any(), any())).thenReturn(Optional.of(checkIn));
        when(habitSessionRepository.save(any())).thenReturn(savedSession);
        when(habitSessionMapper.entityToRespond(any())).thenReturn(mock(HabitSessionRespond.class));

        habitSessionService.createSession(testHabit.getId(), testUser.getId(), request);

        verify(habitRepository, times(1)).save(testHabit);
        assertNotNull(testHabit.getConfig());
        assertEquals(178, testHabit.getConfig().get("currentPage"));
        assertEquals("Atomic Habits", testHabit.getConfig().get("currentBook"));
    }

    @Test
    void getSessions_returnsList() {
        HabitSession session = HabitSession.builder().id(UUID.randomUUID()).habit(testHabit).build();
        when(habitService.verifyOwnership(testHabit.getId(), testUser.getId())).thenReturn(testHabit);
        when(habitSessionRepository.findByHabitIdOrderByCreatedAtDesc(testHabit.getId()))
                .thenReturn(List.of(session));
        when(habitSessionMapper.entitiesToResponds(List.of(session)))
                .thenReturn(List.of(mock(HabitSessionRespond.class)));

        List<HabitSessionRespond> result = habitSessionService.getSessions(testHabit.getId(), testUser.getId());

        assertEquals(1, result.size());
    }

    @Test
    void deleteSession_deletesWhenOwnershipValid() {
        UUID sessionId = UUID.randomUUID();
        HabitSession session = HabitSession.builder().id(sessionId).habit(testHabit).build();

        when(habitService.verifyOwnership(testHabit.getId(), testUser.getId())).thenReturn(testHabit);
        when(habitSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        habitSessionService.deleteSession(testHabit.getId(), testUser.getId(), sessionId);

        verify(habitSessionRepository, times(1)).delete(session);
    }

    @Test
    void deleteSession_throwsUnauthorizedWhenHabitMismatch() {
        UUID sessionId = UUID.randomUUID();
        Habit otherHabit = new Habit();
        otherHabit.setId(UUID.randomUUID());

        HabitSession session = HabitSession.builder().id(sessionId).habit(otherHabit).build();

        when(habitService.verifyOwnership(testHabit.getId(), testUser.getId())).thenReturn(testHabit);
        when(habitSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(UnauthorizedActionException.class, () ->
                habitSessionService.deleteSession(testHabit.getId(), testUser.getId(), sessionId)
        );

        verify(habitSessionRepository, never()).delete(any());
    }
}
