package com.example.smartcity.modules.user.service;

import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.common.base.BaseServiceImpl;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import com.example.smartcity.modules.user.repository.UserWarningRepository;
import com.example.smartcity.modules.user.entity.UserWarning;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
public class UserService extends BaseServiceImpl<User, Long> {

    private final UserRepository userRepository;
    private final UserWarningRepository userWarningRepository;
    private final com.example.smartcity.modules.campaign.repository.CampaignParticipantRepository campaignParticipantRepository;

    public UserService(UserRepository userRepository,
                       UserWarningRepository userWarningRepository,
                       com.example.smartcity.modules.campaign.repository.CampaignParticipantRepository campaignParticipantRepository) {
        this.userRepository = userRepository;
        this.userWarningRepository = userWarningRepository;
        this.campaignParticipantRepository = campaignParticipantRepository;
    }

    @Override
    protected BaseRepository<User, Long> getRepository() {
        return userRepository;
    }

    public boolean isParticipantInStaffCampaigns(Long citizenId, String staffUsername) {
        User staff = findByUsername(staffUsername);
        if (staff.getWard() == null) {
            return false;
        }
        return campaignParticipantRepository.existsByCitizenIdAndWardId(citizenId, staff.getWard().getId());
    }


    @Override
    protected String getResourceName() {
        return "User";
    }

    @org.springframework.transaction.annotation.Transactional
    public User updateUserStatus(Long id, boolean active) {
        User user = findById(id);
        user.setActive(active);
        return userRepository.save(user);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new com.example.smartcity.common.exception.CustomException("Tài khoản không tồn tại", 404));
    }

    @org.springframework.transaction.annotation.Transactional
    public User warnUser(Long userId, String reason, String actorUsername) {
        User user = findById(userId);
        User warnedBy = findByUsername(actorUsername);

        UserWarning warning = new UserWarning(user, warnedBy, reason.trim());
        userWarningRepository.save(warning);

        user.setWarningCount(user.getWarningCount() + 1);
        if (user.getWarningCount() >= 3) {
            user.setStatus("BANNED");
        }
        return userRepository.save(user);
    }

    public java.util.List<User> getBannedUsers() {
        return userRepository.findBannedOrCampaignBannedUsers();
    }

    @org.springframework.transaction.annotation.Transactional
    public User banUser(Long id, String reason, String actorUsername) {
        User user = findById(id);
        User warnedBy = findByUsername(actorUsername);

        UserWarning warning = new UserWarning(user, warnedBy, reason.trim() + " (Chặn trực tiếp)");
        userWarningRepository.save(warning);

        user.setStatus("BANNED");
        user.setWarningCount(3);
        return userRepository.save(user);
    }

    @org.springframework.transaction.annotation.Transactional
    public User unbanUser(Long id) {
        User user = findById(id);
        user.setStatus("ACTIVE");
        user.setWarningCount(0);
        user.setCampaignBanned(false);
        user.setLastCampaignUnbanAt(java.time.LocalDateTime.now());
        return userRepository.save(user);
    }

    @org.springframework.transaction.annotation.Transactional
    public boolean checkAndBanFromCampaigns(Long citizenId, String campaignTitle) {
        User citizen = findById(citizenId);
        if (citizen.isCampaignBanned()) {
            return false;
        }
        long threshold = citizen.getLastCampaignUnbanAt() == null ? 3 : 1;
        long noShowCount = citizen.getLastCampaignUnbanAt() == null
                ? campaignParticipantRepository.countNoShowCampaigns(citizenId)
                : campaignParticipantRepository.countNoShowCampaignsAfter(citizenId, citizen.getLastCampaignUnbanAt());
        if (noShowCount >= threshold) {
            citizen.setCampaignBanned(true);
            userRepository.save(citizen);
            return true;
        }
        return false;
    }

    @org.springframework.transaction.annotation.Transactional
    public void softDeleteUser(Long id, String deletedBy) {
        userRepository.softDeleteById(id, deletedBy);
    }
}
