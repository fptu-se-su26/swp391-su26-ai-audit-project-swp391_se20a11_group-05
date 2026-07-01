package com.example.smartcity.modules.auth.repository;

import com.example.smartcity.modules.auth.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {

    Optional<EmailVerification> findTopByEmailAndIsUsedFalseOrderByCreatedAtDesc(String email);

    List<EmailVerification> findByEmailAndIsUsedFalse(String email);

    @Modifying
    @Query("DELETE FROM EmailVerification e WHERE e.expiresAt < :thresholdDate")
    int deleteOtpsOlderThan(@Param("thresholdDate") LocalDateTime thresholdDate);
}
