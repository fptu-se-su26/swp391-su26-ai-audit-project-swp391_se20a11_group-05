package com.example.smartcity.modules.feedback.repository;

import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.modules.feedback.entity.Category;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface CategoryRepository extends BaseRepository<Category, Long> {
    Optional<Category> findByName(String name);
    Optional<Category> findByCode(String code);
    Optional<Category> findByCodeAndActiveTrue(String code);
    List<Category> findByActiveTrueOrderByIdAsc();
}




