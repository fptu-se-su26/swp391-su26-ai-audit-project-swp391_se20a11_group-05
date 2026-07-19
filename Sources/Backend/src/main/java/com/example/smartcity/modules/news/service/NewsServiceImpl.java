package com.example.smartcity.modules.news.service;

import com.example.smartcity.modules.news.dto.NewsRequestDTO;
import com.example.smartcity.modules.news.dto.NewsResponseDTO;
import com.example.smartcity.modules.news.entity.News;
import com.example.smartcity.modules.news.repository.NewsRepository;
import com.example.smartcity.modules.user.entity.Role;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NewsServiceImpl implements NewsService {

    private final NewsRepository newsRepository;
    private final UserRepository userRepository;

    @Override
    public Page<NewsResponseDTO> getAllNews(String category, String keyword, int page, int size) {
        String effectiveCategory = category == null ? "" : category;
        String effectiveKeyword = keyword == null ? "" : keyword;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<News> newsPage = newsRepository.findNewsWithFilters(effectiveCategory, effectiveKeyword, pageable);
        return newsPage.map(this::mapToDTO);
    }

    @Override
    public NewsResponseDTO getNewsById(Long id) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News not found"));
        news.setViews(news.getViews() + 1);
        newsRepository.save(news);
        return mapToDTO(news);
    }

    @Override
    public NewsResponseDTO createNews(NewsRequestDTO request, String username) {
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (author.getRole() == Role.CITIZEN) {
            throw new RuntimeException("Citizens cannot create news");
        }

        if (author.getRole() == Role.POLICE) {
            if (!"An ninh - Trật tự".equals(request.getCategory()) && !"Thông báo".equals(request.getCategory())) {
                throw new RuntimeException("Police can only post in 'An ninh - Trật tự' or 'Thông báo' categories");
            }
        }

        News news = News.builder()
                .title(request.getTitle())
                .summary(request.getSummary())
                .content(request.getContent())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .author(author)
                .views(0L)
                .build();

        news = newsRepository.save(news);
        return mapToDTO(news);
    }

    @Override
    public NewsResponseDTO updateNews(Long id, NewsRequestDTO request, String username) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.SUPER_ADMIN && user.getRole() != Role.WARD_STAFF && user.getRole() != Role.POLICE) {
            throw new RuntimeException("Not authorized to update this news");
        }

        if (user.getRole() == Role.POLICE) {
            if (!"An ninh - Trật tự".equals(request.getCategory()) && !"Thông báo".equals(request.getCategory())) {
                throw new RuntimeException("Police can only post in 'An ninh - Trật tự' or 'Thông báo' categories");
            }
        }

        news.setTitle(request.getTitle());
        news.setSummary(request.getSummary());
        news.setContent(request.getContent());
        news.setCategory(request.getCategory());
        news.setImageUrl(request.getImageUrl());

        news = newsRepository.save(news);
        return mapToDTO(news);
    }

    @Override
    public void deleteNews(Long id, String username) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.SUPER_ADMIN && user.getRole() != Role.WARD_STAFF && user.getRole() != Role.POLICE) {
            throw new RuntimeException("Not authorized to delete this news");
        }

        newsRepository.delete(news);
    }

    private NewsResponseDTO mapToDTO(News news) {
        return NewsResponseDTO.builder()
                .id(news.getId())
                .title(news.getTitle())
                .summary(news.getSummary())
                .content(news.getContent())
                .category(news.getCategory())
                .imageUrl(news.getImageUrl())
                .views(news.getViews())
                .authorId(news.getAuthor() != null ? news.getAuthor().getId() : null)
                .authorName(news.getAuthor() != null ? news.getAuthor().getFullName() : "Unknown")
                .createdAt(news.getCreatedAt())
                .updatedAt(news.getUpdatedAt())
                .build();
    }
}
