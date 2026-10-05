package com.example.back;

import com.example.back.repository.FriendshipRepository;
import com.example.back.service.FriendshipService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FriendshipServiceTest {

    @Mock
    private FriendshipRepository friendshipRepository;

    @InjectMocks
    private FriendshipService friendshipService;

    private UUID searcherId;
    private UUID candidate1;
    private UUID candidate2;

    @BeforeEach
    void setUp() {
        searcherId = UUID.randomUUID();
        candidate1 = UUID.randomUUID();
        candidate2 = UUID.randomUUID();
    }

    @Test
    void getMutualFriendsCountMap_whenEmptyCandidates_returnsEmptyMap() {
        Map<UUID, Integer> result = friendshipService.getMutualFriendsCountMap(searcherId, Collections.emptyList());
        assertTrue(result.isEmpty());
        verifyNoInteractions(friendshipRepository);
    }

    @Test
    void getMutualFriendsCountMap_whenNullCandidates_returnsEmptyMap() {
        Map<UUID, Integer> result = friendshipService.getMutualFriendsCountMap(searcherId, null);
        assertTrue(result.isEmpty());
        verifyNoInteractions(friendshipRepository);
    }

    @Test
    void getMutualFriendsCountMap_whenMatchesFound_returnsMappedCounts() {
        List<UUID> candidateIds = List.of(candidate1, candidate2);
        List<Object[]> rows = List.of(
                new Object[]{candidate1, 3L},
                new Object[]{candidate2, 1L}
        );

        when(friendshipRepository.countMutualFriends(searcherId, candidateIds)).thenReturn(rows);

        Map<UUID, Integer> result = friendshipService.getMutualFriendsCountMap(searcherId, candidateIds);

        assertEquals(2, result.size());
        assertEquals(3, result.get(candidate1));
        assertEquals(1, result.get(candidate2));
    }
}
