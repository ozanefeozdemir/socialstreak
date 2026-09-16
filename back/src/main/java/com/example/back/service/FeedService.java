package com.example.back.service;

import com.example.back.dto.FeedItemRespond;
import com.example.back.dto.HabitRespond;
import com.example.back.dto.PublicUserRespond;
import com.example.back.dto.UserRespond;
import com.example.back.mapper.HabitMapper;
import com.example.back.mapper.HabitSessionMapper;
import com.example.back.mapper.UserMapper;
import com.example.back.model.CheckIn;
import com.example.back.model.Friendship;
import com.example.back.repository.CheckInRepository;
import com.example.back.repository.FriendshipRepository;
import com.example.back.repository.HabitSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedService {

    private final FriendshipRepository friendshipRepository;
    private final CheckInRepository checkInRepository;
    private final HabitSessionRepository habitSessionRepository;
    private final UserMapper userMapper;
    private final HabitMapper habitMapper;
    private final HabitSessionMapper habitSessionMapper;

    @Transactional(readOnly = true)
    public List<FeedItemRespond> getFeed(UUID currentUserId) {
        List<Friendship> friendships = friendshipRepository.findByUserId(currentUserId);
        if (friendships.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> friendIds = friendships.stream()
                .map(f -> f.getFriend().getId())
                .distinct()
                .collect(Collectors.toList());

        List<CheckIn> feedCheckIns = checkInRepository.findFeedCheckInsByUserIds(friendIds);
        if (feedCheckIns.isEmpty()) {
            return Collections.emptyList();
        }

        // Batch load latest sessions for these check-ins
        List<UUID> checkInIds = feedCheckIns.stream().map(CheckIn::getId).collect(Collectors.toList());
        List<com.example.back.model.HabitSession> sessions = habitSessionRepository.findByCheckInIdIn(checkInIds);
        Map<UUID, com.example.back.model.HabitSession> checkInSessionMap = new HashMap<>();
        for (com.example.back.model.HabitSession s : sessions) {
            if (s.getCheckIn() != null) {
                UUID cId = s.getCheckIn().getId();
                checkInSessionMap.compute(cId, (k, existing) -> {
                    if (existing == null || s.getCreatedAt().isAfter(existing.getCreatedAt())) {
                        return s;
                    }
                    return existing;
                });
            }
        }

        // Cache all check-in dates for habits present in the feed to compute streaks efficiently
        Map<UUID, List<LocalDate>> habitCheckInDatesMap = new HashMap<>();
        for (CheckIn ci : feedCheckIns) {
            UUID habitId = ci.getHabit().getId();
            habitCheckInDatesMap.computeIfAbsent(habitId, id ->
                    checkInRepository.findByHabitIdOrderByCheckInDateDesc(id).stream()
                            .map(CheckIn::getCheckInDate)
                            .collect(Collectors.toList())
            );
        }

        List<FeedItemRespond> result = new ArrayList<>(feedCheckIns.size());
        for (CheckIn checkIn : feedCheckIns) {
            UUID habitId = checkIn.getHabit().getId();
            List<LocalDate> allDates = habitCheckInDatesMap.getOrDefault(habitId, Collections.emptyList());
            int streak = calculateStreakForDate(allDates, checkIn.getCheckInDate());

            PublicUserRespond userDto = userMapper.entityToPublicRespond(checkIn.getHabit().getUser());
            HabitRespond habitDto = habitMapper.entityToRespond(checkIn.getHabit());

            com.example.back.model.HabitSession session = checkInSessionMap.get(checkIn.getId());
            com.example.back.dto.HabitSessionRespond sessionDto = session != null
                    ? habitSessionMapper.entityToRespond(session)
                    : null;

            result.add(new FeedItemRespond(
                    checkIn.getId(),
                    checkIn.getCheckInDate(),
                    checkIn.getCreatedAt(),
                    userDto,
                    habitDto,
                    streak,
                    sessionDto
            ));
        }

        return result;
    }

    private int calculateStreakForDate(List<LocalDate> sortedDatesDesc, LocalDate targetDate) {
        if (sortedDatesDesc == null || sortedDatesDesc.isEmpty()) {
            return 1;
        }
        int startIndex = sortedDatesDesc.indexOf(targetDate);
        if (startIndex == -1) {
            return 1;
        }

        int streak = 1;
        LocalDate expectedPrevDate = targetDate.minusDays(1);

        for (int i = startIndex + 1; i < sortedDatesDesc.size(); i++) {
            LocalDate prevDate = sortedDatesDesc.get(i);
            if (prevDate.equals(expectedPrevDate)) {
                streak++;
                expectedPrevDate = expectedPrevDate.minusDays(1);
            } else if (prevDate.isBefore(expectedPrevDate)) {
                break;
            }
        }

        return streak;
    }
}
