package com.example.smartcity.modules.police.service;

import com.example.smartcity.modules.police.dto.PoliceScheduleRequest;
import com.example.smartcity.modules.police.entity.PoliceSchedule;
import com.example.smartcity.modules.police.repository.PoliceScheduleRepository;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PoliceScheduleService {

    private final PoliceScheduleRepository scheduleRepository;
    private final UserRepository userRepository;

    /**
     * Lấy lịch trực ban theo username và mondayKey
     */
    public Optional<PoliceSchedule> getSchedule(String username, String mondayKey) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user công an: " + username));

        if (user.getWard() == null) {
            throw new RuntimeException("Cán bộ công an phải thuộc một phường/xã để lấy lịch trực.");
        }

        return scheduleRepository.findByWardIdAndMondayKey(user.getWard().getId(), mondayKey);
    }

    /**
     * Lấy lịch trực ban công khai theo wardId và mondayKey
     */
    public Optional<PoliceSchedule> getPublicSchedule(Long wardId, String mondayKey) {
        return scheduleRepository.findByWardIdAndMondayKey(wardId, mondayKey);
    }

    /**
     * Lưu hoặc cập nhật lịch trực ban
     */
    @Transactional
    public PoliceSchedule saveSchedule(String username, PoliceScheduleRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user công an: " + username));

        if (user.getWard() == null) {
            throw new RuntimeException("Cán bộ công an phải thuộc một phường/xã để phân công lịch trực.");
        }

        Long wardId = user.getWard().getId();
        Optional<PoliceSchedule> existing = scheduleRepository.findByWardIdAndMondayKey(wardId, request.getMondayKey());

        PoliceSchedule schedule;
        if (existing.isPresent()) {
            schedule = existing.get();
            schedule.setScheduleData(request.getScheduleData());
        } else {
            schedule = new PoliceSchedule(wardId, request.getMondayKey(), request.getScheduleData());
        }

        return scheduleRepository.save(schedule);
    }
}
