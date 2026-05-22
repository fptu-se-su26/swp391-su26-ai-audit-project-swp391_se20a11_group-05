package com.example.smartcity.modules.feedback.mapper;

import com.example.smartcity.common.base.BaseMapper;
import com.example.smartcity.modules.feedback.dto.FeedbackResponse;
import com.example.smartcity.modules.feedback.entity.Feedback;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface FeedbackMapper extends BaseMapper<Feedback, FeedbackResponse> {

    @Override
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "citizenName", source = "citizen.fullName")
    @Mapping(target = "assigneeName", source = "assignee.fullName")
    FeedbackResponse toDto(Feedback entity);
    
    // We don't map back from Response to Entity usually, so we can ignore it or leave default
}
