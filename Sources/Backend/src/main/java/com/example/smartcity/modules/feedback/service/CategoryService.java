package com.example.smartcity.modules.feedback.service;

import com.example.smartcity.common.base.BaseRepository;
import com.example.smartcity.common.base.BaseServiceImpl;
import com.example.smartcity.modules.feedback.entity.Category;
import com.example.smartcity.modules.feedback.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CategoryService extends BaseServiceImpl<Category, Long> {

    private final CategoryRepository categoryRepository;

    @Override
    protected BaseRepository<Category, Long> getRepository() {
        return categoryRepository;
    }

    @Override
    protected String getResourceName() {
        return "Category";
    }
}




