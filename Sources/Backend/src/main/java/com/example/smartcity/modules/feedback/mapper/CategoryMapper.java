package com.example.smartcity.modules.feedback.mapper;

import com.example.smartcity.common.base.BaseMapper;
import com.example.smartcity.modules.feedback.dto.CategoryDTO;
import com.example.smartcity.modules.feedback.entity.Category;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface CategoryMapper extends BaseMapper<Category, CategoryDTO> {
}
