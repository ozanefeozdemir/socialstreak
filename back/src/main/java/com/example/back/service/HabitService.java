package com.example.back.service;

import com.example.back.dto.HabitRequest;
import com.example.back.dto.HabitRespond;
import com.example.back.dto.TrendingHabitRespond;
import com.example.back.exception.ResourceNotFoundException;
import com.example.back.exception.UnauthorizedActionException;
import com.example.back.mapper.HabitMapper;
import com.example.back.model.FrequencyType;
import com.example.back.model.Habit;
import com.example.back.model.HabitType;
import com.example.back.model.User;
import com.example.back.repository.CheckInRepository;
import com.example.back.repository.HabitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final CheckInRepository checkInRepository;
    private final UserService userService;
    private final HabitMapper habitMapper;

    @Transactional(readOnly = true)
    public HabitRespond findById(UUID habitId, UUID userId){
        Habit habit = verifyOwnership(habitId,userId);
        return habitMapper.entityToRespond(habit);
    }

    @Transactional(readOnly = true)
    public List<HabitRespond> findAllByUserId(UUID userId){
        List<Habit> habits = habitRepository.findByUserId(userId);
        return habitMapper.entitiesToResponds(habits);
    }

    @Transactional
    public HabitRespond create(HabitRequest habitRequest, UUID userId){
        User user = userService.findUserById(userId);
        Habit habit = habitMapper.requestToEntity(habitRequest);
        habit.setUser(user);
        if (habit.getHabitType() == null) {
            habit.setHabitType(com.example.back.model.HabitType.GENERAL);
        }
        return habitMapper.entityToRespond(habitRepository.save(habit));
    }

    @Transactional
    public HabitRespond  update(UUID habitId, HabitRequest habitRequest, UUID userId){
        Habit habit = verifyOwnership(habitId,userId);

        habit.setName(habitRequest.name());
        habit.setFrequencyType(habitRequest.frequencyType());
        if (habitRequest.habitType() != null) {
            habit.setHabitType(habitRequest.habitType());
        }
        if (habitRequest.config() != null) {
            habit.setConfig(habitRequest.config());
        }
        if (habitRequest.isPublic() != null) {
            habit.setIsPublic(habitRequest.isPublic());
        }

        return habitMapper.entityToRespond(habitRepository.save(habit));
    }

    @Transactional
    public HabitRespond archive(UUID habitId, UUID userId){
        Habit habit = verifyOwnership(habitId,userId);
        habit.setArchived(true);
        return habitMapper.entityToRespond(habitRepository.save(habit));
    }

    @Transactional
    public HabitRespond unarchive(UUID habitId, UUID userId){
        Habit habit = verifyOwnership(habitId,userId);
        habit.setArchived(false);
        return habitMapper.entityToRespond(habitRepository.save(habit));
    }

    @Transactional
    public void delete(UUID habitId,  UUID userId){
        Habit habit = verifyOwnership(habitId,userId);
        habitRepository.delete(habit);
    }

    @Transactional
    public Habit verifyOwnership(UUID habitId, UUID userId) {
        //  Cheks existence of habit and associations with user.
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new ResourceNotFoundException("Habit does not exist."));
        if (!habit.getUser().getId().equals(userId)) {
            throw new UnauthorizedActionException("You are not allowed to perform this operation.");
        }
        return habit;
    }

    @Transactional(readOnly = true)
    public List<TrendingHabitRespond> getTrendingHabits() {
        // 1. Fetch real DB participant counts grouped by habit name
        List<Object[]> dbParticipants = habitRepository.countPublicHabitParticipants();
        Map<String, Long> participantMap = new HashMap<>();
        if (dbParticipants != null) {
            for (Object[] row : dbParticipants) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    participantMap.put(row[0].toString().trim().toLowerCase(), ((Number) row[1]).longValue());
                }
            }
        }

        // 2. Fetch real active streak counts (check-in today or yesterday)
        LocalDate yesterday = LocalDate.now().minusDays(1);
        List<Object[]> dbStreaks = checkInRepository.countActiveStreaksSinceDate(yesterday);
        Map<String, Long> streakMap = new HashMap<>();
        if (dbStreaks != null) {
            for (Object[] row : dbStreaks) {
                if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                    streakMap.put(row[0].toString().trim().toLowerCase(), ((Number) row[1]).longValue());
                }
            }
        }

        // 3. Platform community habits with realistic baseline stats (including user's LoL specification)
        List<TrendingHabitRespond> curated = List.of(
                new TrendingHabitRespond(
                        "lol-gaming",
                        "League of Legends (LoL)",
                        HabitType.GENERAL,
                        "Gaming",
                        "game-controller",
                        "#6C5CE7",
                        1000L,
                        100L,
                        FrequencyType.DAILY,
                        "Günün ilk galibiyeti veya maks 2 oyun (tilt olmadan)",
                        Map.of("category", "Gaming", "icon", "game-controller", "color", "#6C5CE7", "sessionArchetype", "STOPWATCH", "targetValue", 60, "targetUnit", "min")
                ),
                new TrendingHabitRespond(
                        "morning-workout",
                        "Morning Workout",
                        HabitType.WORKOUT,
                        "Fitness",
                        "barbell",
                        "#FF7675",
                        850L,
                        120L,
                        FrequencyType.DAILY,
                        "Sabah egzersizi, esneme veya spor salonu antrenmanı",
                        Map.of("category", "Fitness", "icon", "barbell", "color", "#FF7675", "sessionArchetype", "TIMER", "targetValue", 30, "targetUnit", "min")
                ),
                new TrendingHabitRespond(
                        "daily-reading",
                        "Daily Book Reading",
                        HabitType.READING,
                        "Learning",
                        "book",
                        "#00CEC9",
                        740L,
                        95L,
                        FrequencyType.DAILY,
                        "Günde en az 20 sayfa kitap okuma",
                        Map.of("category", "Learning", "icon", "book", "color", "#00CEC9", "sessionArchetype", "NUMERIC", "targetValue", 20, "targetUnit", "pages")
                ),
                new TrendingHabitRespond(
                        "drink-water",
                        "Drink 2L Water",
                        HabitType.WATER,
                        "Health",
                        "water",
                        "#0984E3",
                        1450L,
                        280L,
                        FrequencyType.DAILY,
                        "Gün boyu vücudu sulu tut, zinde kal",
                        Map.of("category", "Health", "icon", "water", "color", "#0984E3", "sessionArchetype", "COUNTER", "targetValue", 8, "targetUnit", "glasses")
                ),
                new TrendingHabitRespond(
                        "coding-leetcode",
                        "Coding & LeetCode",
                        HabitType.GENERAL,
                        "Productivity",
                        "code-slash",
                        "#A29BFE",
                        630L,
                        88L,
                        FrequencyType.DAILY,
                        "En az bir algoritma sorusu çöz veya 45 dk kod yaz",
                        Map.of("category", "Productivity", "icon", "code-slash", "color", "#A29BFE", "sessionArchetype", "STOPWATCH", "targetValue", 45, "targetUnit", "min")
                ),
                new TrendingHabitRespond(
                        "10k-steps",
                        "10,000 Steps Daily",
                        HabitType.RUNNING,
                        "Fitness",
                        "footsteps",
                        "#FD79A8",
                        920L,
                        160L,
                        FrequencyType.DAILY,
                        "Günlük hareket hedefini tamamla",
                        Map.of("category", "Fitness", "icon", "footsteps", "color", "#FD79A8", "sessionArchetype", "NUMERIC", "targetValue", 10000, "targetUnit", "steps")
                ),
                new TrendingHabitRespond(
                        "meditation-mind",
                        "10-Min Meditation",
                        HabitType.MEDITATION,
                        "Mindfulness",
                        "leaf",
                        "#55EFC4",
                        520L,
                        75L,
                        FrequencyType.DAILY,
                        "Günün stresinden arın, nefesine odaklan",
                        Map.of("category", "Mindfulness", "icon", "leaf", "color", "#55EFC4", "sessionArchetype", "TIMER", "targetValue", 10, "targetUnit", "min")
                ),
                new TrendingHabitRespond(
                        "duolingo-lang",
                        "Language / Duolingo",
                        HabitType.GENERAL,
                        "Learning",
                        "chatbubbles",
                        "#FDCB6E",
                        480L,
                        64L,
                        FrequencyType.DAILY,
                        "Günlük 15 dakika dil pratiği ve kelime tekrarı",
                        Map.of("category", "Learning", "icon", "chatbubbles", "color", "#FDCB6E", "sessionArchetype", "TIMER", "targetValue", 15, "targetUnit", "min")
                )
        );

        List<TrendingHabitRespond> result = new ArrayList<>();

        // Merge baseline stats with actual DB statistics
        for (TrendingHabitRespond item : curated) {
            String norm = item.name().trim().toLowerCase();
            long extraParticipants = 0;
            long extraStreaks = 0;

            for (Map.Entry<String, Long> entry : participantMap.entrySet()) {
                if (entry.getKey().contains("lol") || entry.getKey().contains("league")) {
                    if (item.id().equals("lol-gaming")) {
                        extraParticipants += entry.getValue();
                    }
                } else if (norm.contains(entry.getKey()) || entry.getKey().contains(norm)) {
                    extraParticipants += entry.getValue();
                }
            }
            for (Map.Entry<String, Long> entry : streakMap.entrySet()) {
                if (entry.getKey().contains("lol") || entry.getKey().contains("league")) {
                    if (item.id().equals("lol-gaming")) {
                        extraStreaks += entry.getValue();
                    }
                } else if (norm.contains(entry.getKey()) || entry.getKey().contains(norm)) {
                    extraStreaks += entry.getValue();
                }
            }

            result.add(new TrendingHabitRespond(
                    item.id(),
                    item.name(),
                    item.habitType(),
                    item.category(),
                    item.icon(),
                    item.color(),
                    item.participantCount() + extraParticipants,
                    item.activeStreakCount() + extraStreaks,
                    item.defaultFrequency(),
                    item.description(),
                    item.config()
            ));
        }

        // Sort descending by participant count, then active streak count
        result.sort((a, b) -> {
            int cmp = Long.compare(b.participantCount(), a.participantCount());
            if (cmp != 0) return cmp;
            return Long.compare(b.activeStreakCount(), a.activeStreakCount());
        });

        return result;
    }
}
