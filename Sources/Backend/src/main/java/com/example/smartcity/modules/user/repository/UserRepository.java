package com.example.smartcity.modules.user.repository;

import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.modules.user.entity.User;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends BaseRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByPhoneNumber(String phoneNumber);
}




