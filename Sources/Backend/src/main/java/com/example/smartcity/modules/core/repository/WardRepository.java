package com.example.smartcity.modules.core.repository;

import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.modules.core.entity.Ward;
import org.springframework.stereotype.Repository;

@Repository
public interface WardRepository extends BaseRepository<Ward, Long> {
}
