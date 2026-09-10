package com.example.back.repository;

import com.example.back.model.FriendRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, UUID> {

    // Kullanıcıya gelen bekleyen istekleri listeler
    List<FriendRequest> findByReceiverId(UUID receiverId);

    // Kullanıcının gönderdiği bekleyen istekleri listeler
    List<FriendRequest> findBySenderId(UUID senderId);

    // Belirli bir kişinin belirli bir kişiye attığı tekil isteği bulur (Kabul/Red işlemleri için)
    Optional<FriendRequest> findBySenderIdAndReceiverId(UUID senderId, UUID receiverId);

    // A->B veya B->A yönünde herhangi bir pending istek olup olmadığını kontrol eder (Çapraz isteği engellemek için)
    @Query(value = "SELECT f FROM FriendRequest f WHERE (f.sender.id = :user1 AND f.receiver.id = :user2) OR (f.sender.id = :user2 AND f.receiver.id = :user1)")
    Optional<FriendRequest> findRequestBetweenUsers(@Param("user1") UUID user1, @Param("user2") UUID user2);
}