package com.example.smartcity.modules.news.controller;

import com.example.smartcity.modules.news.dto.NewsRequestDTO;
import com.example.smartcity.modules.news.dto.NewsResponseDTO;
import com.example.smartcity.modules.news.service.NewsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;

    @GetMapping
    public ResponseEntity<Page<NewsResponseDTO>> getAllNews(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(newsService.getAllNews(category, keyword, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewsResponseDTO> getNewsById(@PathVariable Long id) {
        return ResponseEntity.ok(newsService.getNewsById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WARD_STAFF', 'POLICE')")
    public ResponseEntity<NewsResponseDTO> createNews(@Valid @RequestBody NewsRequestDTO request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(newsService.createNews(request, currentUsername));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WARD_STAFF', 'POLICE')")
    public ResponseEntity<NewsResponseDTO> updateNews(@PathVariable Long id, @Valid @RequestBody NewsRequestDTO request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(newsService.updateNews(id, request, currentUsername));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'WARD_STAFF', 'POLICE')")
    public ResponseEntity<Void> deleteNews(@PathVariable Long id) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        newsService.deleteNews(id, currentUsername);
        return ResponseEntity.noContent().build();
    }
}
