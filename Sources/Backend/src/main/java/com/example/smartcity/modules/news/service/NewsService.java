package com.example.smartcity.modules.news.service;

import com.example.smartcity.modules.news.dto.NewsRequestDTO;
import com.example.smartcity.modules.news.dto.NewsResponseDTO;
import org.springframework.data.domain.Page;

public interface NewsService {
    Page<NewsResponseDTO> getAllNews(String category, String keyword, int page, int size);
    NewsResponseDTO getNewsById(Long id);
    NewsResponseDTO createNews(NewsRequestDTO request, String username);
    NewsResponseDTO updateNews(Long id, NewsRequestDTO request, String username);
    void deleteNews(Long id, String username);
}
