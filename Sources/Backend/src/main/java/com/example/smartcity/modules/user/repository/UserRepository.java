package com.example.smartcity.modules.user.repository;

import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.modules.user.entity.User;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends BaseRepository<User, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"ward"})
    org.springframework.data.domain.Page<User> findAll(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"ward"})
    Optional<User> findByUsername(String username);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"ward"})
    Optional<User> findByEmail(String email);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"ward"})
    Optional<User> findByPhoneNumber(String phoneNumber);
}
