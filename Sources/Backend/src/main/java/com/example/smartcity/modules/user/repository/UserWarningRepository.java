package com.example.smartcity.modules.user.repository;

import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.modules.user.entity.UserWarning;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserWarningRepository extends BaseRepository<UserWarning, Long> {
    List<UserWarning> findByUser_IdOrderByCreatedAtDesc(Long userId);
}
