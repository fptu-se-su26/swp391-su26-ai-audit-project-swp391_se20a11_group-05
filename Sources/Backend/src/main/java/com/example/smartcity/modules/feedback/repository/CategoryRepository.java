package com.example.smartcity.modules.feedback.repository;

import com.example.smartcity.modules.feedback.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
}




