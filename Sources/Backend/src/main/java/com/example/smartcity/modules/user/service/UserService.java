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
@RequiredArgsConstructor
public class UserService extends BaseServiceImpl<User, Long> {

    private final UserRepository userRepository;
    private final UserWarningRepository userWarningRepository;

    @Override
    protected BaseRepository<User, Long> getRepository() {
        return userRepository;
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
        return userRepository.findByStatus("BANNED");
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
        return userRepository.save(user);
    }
}
