package com.example.smartcity.modules.feedback.controller;

import com.example.smartcity.common.base.BaseGenericController;
import com.example.smartcity.common.base.BaseMapper;
import com.example.smartcity.common.base.BaseService;
import com.example.smartcity.modules.feedback.dto.CategoryDTO;
import com.example.smartcity.modules.feedback.entity.Category;
import com.example.smartcity.modules.feedback.mapper.CategoryMapper;
import com.example.smartcity.modules.feedback.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController extends BaseGenericController<Category, CategoryDTO, Long> {

    private final CategoryService categoryService;
    private final CategoryMapper categoryMapper;

    @Override
    protected BaseService<Category, Long> getService() {
        return categoryService;
    }

    @Override
    protected BaseMapper<Category, CategoryDTO> getMapper() {
        return categoryMapper;
    }
}




