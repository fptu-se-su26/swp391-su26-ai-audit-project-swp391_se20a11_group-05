package com.example.smartcity.modules.auth.repository;

import com.example.smartcity.modules.auth.entity.SmsVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SmsVerificationRepository extends JpaRepository<SmsVerification, Long> {

    // Tìm mã OTP chưa sử dụng gần nhất của một số điện thoại
    Optional<SmsVerification> findTopByPhoneNumberAndIsUsedFalseOrderByCreatedAtDesc(String phoneNumber);
}
