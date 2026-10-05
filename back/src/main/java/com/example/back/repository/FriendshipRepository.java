package com.example.back.repository;

import com.example.back.model.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {

    // Kullanıcının tüm arkadaşlarını getirir (Index'i kullanır)
    List<Friendship> findByUserId(UUID userId);

    // İki kişi arasında halihazırda arkadaşlık var mı diye kontrol eder
    boolean existsByUserIdAndFriendId(UUID userId, UUID friendId);

    // Arkadaşlıktan çıkarma işlemi için iki satırı (A->B ve B->A) tek seferde siler
    @Modifying
    @Query("DELETE FROM Friendship f WHERE (f.user.id = :user1 AND f.friend.id = :user2) OR (f.user.id = :user2 AND f.friend.id = :user1)")
    void deleteFriendshipBetweenUsers(@Param("user1") UUID user1, @Param("user2") UUID user2);

    @Query("""
        SELECT f2.user.id, COUNT(f2.friend.id)
        FROM Friendship f1, Friendship f2
        WHERE f1.user.id = :searcherId
          AND f2.user.id IN :candidateIds
          AND f1.friend.id = f2.friend.id
        GROUP BY f2.user.id
    """)
    List<Object[]> countMutualFriends(@Param("searcherId") UUID searcherId, @Param("candidateIds") List<UUID> candidateIds);
}