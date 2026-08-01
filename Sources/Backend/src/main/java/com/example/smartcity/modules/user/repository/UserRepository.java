package com.example.smartcity.modules.user.repository;

import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.modules.user.entity.User;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends BaseRepository<User, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"ward"})
    org.springframework.data.domain.Page<User> findAll(org.springframework.data.domain.Pageable pageable);

    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameIgnoreCase(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    java.util.List<User> findByRoleAndWardId(com.example.smartcity.modules.user.entity.Role role, Long wardId);

    java.util.List<User> findByStatus(String status);

    @Query("SELECT u FROM User u WHERE u.status = 'BANNED' OR u.isCampaignBanned = true")
    java.util.List<User> findBannedOrCampaignBannedUsers();

    Optional<User> findByPhoneNumber(String phoneNumber);

    /** Hard delete kể cả soft-deleted rows — chỉ dùng cho dev seed */
    @Modifying
    @Query(value = "DELETE FROM users WHERE username = :username", nativeQuery = true)
    void hardDeleteByUsername(@Param("username") String username);

    @Modifying
    @Query(value = "DELETE FROM users WHERE phone_number = :phone", nativeQuery = true)
    void hardDeleteByPhoneNumber(@Param("phone") String phone);

    @Modifying
    @Query(value = "DELETE FROM users WHERE email = :email", nativeQuery = true)
    void hardDeleteByEmail(@Param("email") String email);

    @Modifying
    @Query("UPDATE User u SET u.deletedAt = CURRENT_TIMESTAMP, u.deletedBy = :deletedBy WHERE u.id = :id")
    void softDeleteById(@Param("id") Long id, @Param("deletedBy") String deletedBy);
}
