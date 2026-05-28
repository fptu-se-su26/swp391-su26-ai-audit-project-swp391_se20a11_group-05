package com.example.smartcity.modules.core.repository;

import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.modules.core.entity.Ward;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WardRepository extends BaseRepository<Ward, Long> {
    Optional<Ward> findByName(String name);
    List<Ward> findByNameContainingIgnoreCase(String name);
}
