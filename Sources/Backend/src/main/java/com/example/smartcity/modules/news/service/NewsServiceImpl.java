package com.example.smartcity.modules.news.service;

import com.example.smartcity.common.exception.ResourceNotFoundException;
import com.example.smartcity.modules.news.dto.NewsRequestDTO;
import com.example.smartcity.modules.news.dto.NewsResponseDTO;
import com.example.smartcity.modules.news.entity.News;
import com.example.smartcity.modules.news.exception.InvalidNewsCategoryException;
import com.example.smartcity.modules.news.exception.NewsAccessDeniedException;
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

import java.util.Arrays;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NewsServiceImpl implements NewsService {

    private final NewsRepository newsRepository;
    private final UserRepository userRepository;

    // Allowed categories for each role
    private static final List<String> POLICE_ALLOWED_CATEGORIES = Arrays.asList("An ninh - Trật tự", "Thông báo");
    private static final List<String> ALL_CATEGORIES = Arrays.asList(
        "Thông báo", "Chính sách", "Hoạt động", "Hạ tầng - Đô thị", 
        "Kinh tế - Xã hội", "An ninh - Trật tự", "Hướng dẫn", "Tin tức"
    );

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
                .orElseThrow(() -> new ResourceNotFoundException("Tin tức", id));
        news.setViews(news.getViews() + 1);
        newsRepository.save(news);
        return mapToDTO(news);
    }

    @Override
    public NewsResponseDTO createNews(NewsRequestDTO request, String username) {
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        // Validate role permission
        if (author.getRole() == Role.CITIZEN) {
            throw new NewsAccessDeniedException("Người dân không có quyền đăng tin tức");
        }

        // Validate category permission by role
        validateCategoryPermission(author.getRole(), request.getCategory());

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
                .orElseThrow(() -> new ResourceNotFoundException("Tin tức", id));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        // Validate role permission
        if (user.getRole() == Role.CITIZEN) {
            throw new NewsAccessDeniedException("Người dân không có quyền chỉnh sửa tin tức");
        }

        // Ownership check: Only SUPER_ADMIN can edit others' news
        if (user.getRole() != Role.SUPER_ADMIN) {
            if (news.getAuthor() == null || !news.getAuthor().getId().equals(user.getId())) {
                throw new NewsAccessDeniedException("Bạn chỉ có thể chỉnh sửa tin tức do chính bạn tạo ra");
            }
        }

        // Validate category permission by role
        validateCategoryPermission(user.getRole(), request.getCategory());

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
                .orElseThrow(() -> new ResourceNotFoundException("Tin tức", id));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        // Validate role permission
        if (user.getRole() == Role.CITIZEN) {
            throw new NewsAccessDeniedException("Người dân không có quyền xóa tin tức");
        }

        // Ownership check: Only SUPER_ADMIN can delete others' news
        if (user.getRole() != Role.SUPER_ADMIN) {
            if (news.getAuthor() == null || !news.getAuthor().getId().equals(user.getId())) {
                throw new NewsAccessDeniedException("Bạn chỉ có thể xóa tin tức do chính bạn tạo ra");
            }
        }

        newsRepository.delete(news);
    }

    /**
     * Validate if user role has permission to post in the given category
     */
    private void validateCategoryPermission(Role role, String category) {
        if (role == Role.SUPER_ADMIN || role == Role.WARD_STAFF) {
            // SUPER_ADMIN and WARD_STAFF can post in all categories
            if (!ALL_CATEGORIES.contains(category)) {
                throw new InvalidNewsCategoryException("Chuyên mục không hợp lệ: " + category);
            }
        } else if (role == Role.POLICE) {
            // POLICE can only post in limited categories
            if (!POLICE_ALLOWED_CATEGORIES.contains(category)) {
                throw new InvalidNewsCategoryException(
                    "Công an chỉ được đăng tin trong chuyên mục: " + String.join(", ", POLICE_ALLOWED_CATEGORIES)
                );
            }
        } else {
            throw new NewsAccessDeniedException("Vai trò của bạn không được phép đăng tin tức");
        }
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
