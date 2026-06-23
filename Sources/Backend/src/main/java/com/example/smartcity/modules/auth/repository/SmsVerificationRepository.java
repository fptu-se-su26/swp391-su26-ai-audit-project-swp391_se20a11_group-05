package com.example.smartcity.modules.auth.repository;

import com.example.smartcity.modules.auth.entity.SmsVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

@Repository
public interface SmsVerificationRepository extends JpaRepository<SmsVerification, Long> {

    // [UPGRADE] Thêm Khóa bi quan (Pessimistic Lock) để chống lại lỗ hổng Race Condition (Mò mã OTP bằng cách bắn 50 requests cùng 1ms)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<SmsVerification> findTopByPhoneNumberAndIsUsedFalseOrderByCreatedAtDesc(String phoneNumber);

    // Lấy danh sách tất cả các mã chưa sử dụng (để hủy trước khi tạo mã mới)
    java.util.List<SmsVerification> findByPhoneNumberAndIsUsedFalse(String phoneNumber);

    // [UPGRADE] Xóa vật lý các OTP cũ để tránh phình to Database
    @Modifying
    @Transactional
    @Query("DELETE FROM SmsVerification s WHERE s.expiresAt < :thresholdDate")
    int deleteOtpsOlderThan(@Param("thresholdDate") LocalDateTime thresholdDate);
}
