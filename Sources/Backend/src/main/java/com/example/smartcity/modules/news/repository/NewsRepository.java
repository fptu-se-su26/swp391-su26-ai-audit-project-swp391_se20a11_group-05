package com.example.smartcity.modules.news.repository;

import com.example.smartcity.modules.news.entity.News;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NewsRepository extends JpaRepository<News, Long> {

    @Query("SELECT n FROM News n WHERE " +
           "(:category IS NULL OR :category = '' OR n.category = :category) AND " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(n.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) OR LOWER(n.summary) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))")
    Page<News> findNewsWithFilters(@Param("category") String category, @Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT n FROM News n ORDER BY n.views DESC")
    List<News> findTopByOrderByViewsDesc(Pageable pageable);
}
