package com.example.back.service;

import com.example.back.dto.FriendRequestRespond;
import com.example.back.exception.ResourceNotFoundException;
import com.example.back.exception.UnauthorizedActionException;
import com.example.back.mapper.FriendshipMapper;
import com.example.back.model.FriendRequest;
import com.example.back.model.Friendship;
import com.example.back.model.User;
import com.example.back.repository.FriendRequestRepository;
import com.example.back.repository.FriendshipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FriendshipRequestService {

    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserService userService;
    private final FriendshipMapper friendshipMapper;

    @Transactional
    public FriendRequestRespond sendRequest(UUID userId, UUID friendId){
        if(userId.equals(friendId)){
            throw new IllegalArgumentException("Kendinize arkadaşlık isteği atamazsınız.");
        }

        if(friendshipRepository.existsByUserIdAndFriendId(userId, friendId)) {
            throw new IllegalStateException("Bu kişiyle zaten arkadaşsınız.");
        }

        if(friendRequestRepository.findRequestBetweenUsers(userId, friendId).isPresent()){
            throw new IllegalStateException("Bu kişiyle aranızda bekleyen bir arkadaşlık isteği var.");
        }

        User user = userService.findUserById(userId);
        User friend = userService.findUserById(friendId);

        FriendRequest friendRequest = new FriendRequest();
        friendRequest.setSender(user);
        friendRequest.setReceiver(friend);

        return friendshipMapper.friendRequestToRespond(friendRequestRepository.save(friendRequest));
    }

    @Transactional
    public void acceptRequest(UUID requestId, UUID currentUserId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Arkadaşlık isteği bulunamadı."));

        // Güvenlik: Sadece isteği alan kişi (receiver) onaylayabilir
        if (!request.getReceiver().getId().equals(currentUserId)) {
            throw new UnauthorizedActionException("Bu isteği onaylama yetkiniz yok.");
        }

        User sender = request.getSender();
        User receiver = request.getReceiver();

        // 1. Çift yönlü arkadaşlık kaydını (Double Entry) oluştur
        Friendship friendship1 = Friendship.builder().user(receiver).friend(sender).build();
        Friendship friendship2 = Friendship.builder().user(sender).friend(receiver).build();
        friendshipRepository.saveAll(List.of(friendship1, friendship2));

        // 2. Bekleyen isteği tamamen sil
        friendRequestRepository.delete(request);
    }

    @Transactional
    public void removeRequest(UUID requestId, UUID currentUserId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Arkadaşlık isteği bulunamadı."));

        // İsteği atan kişi (İptal) VEYA isteği alan kişi (Reddetme) bu satırı silebilir
        if (request.getSender().getId().equals(currentUserId) ||
                request.getReceiver().getId().equals(currentUserId)) {

            friendRequestRepository.delete(request);
        } else {
            throw new UnauthorizedActionException("Bu işlemi yapma yetkiniz yok.");
        }
    }
    @Transactional(readOnly = true)
    public List<FriendRequestRespond> findReceivedRequests(UUID currentUserId) {
        return friendshipMapper.friendRequestsToResponds(friendRequestRepository.findByReceiverId(currentUserId));
    }

    @Transactional(readOnly = true)
    public List<FriendRequestRespond> findSentRequests(UUID currentUserId) {
        return friendshipMapper.friendRequestsToResponds(
                friendRequestRepository.findBySenderId(currentUserId)
        );
    }
}