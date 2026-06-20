package com.example.smartcity.modules.feedback.mapper;

import com.example.smartcity.common.base.BaseMapper;
import com.example.smartcity.modules.feedback.dto.FeedbackAttachmentResponse;
import com.example.smartcity.modules.feedback.dto.FeedbackResponse;
import com.example.smartcity.modules.feedback.entity.Attachment;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.repository.AttachmentRepository;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public abstract class FeedbackMapper implements BaseMapper<Feedback, FeedbackResponse> {

    @Autowired
    protected AttachmentRepository attachmentRepository;

    @Override
    @Mapping(target = "category", source = "categoryName")
    @Mapping(target = "wardId", source = "ward.id")
    @Mapping(target = "citizenName", source = "citizen.fullName")
    @Mapping(target = "citizenPhone", source = "citizen.phoneNumber")
    @Mapping(target = "citizenEmail", source = "citizen.email")
    @Mapping(target = "citizenId", source = "citizen.id")
    @Mapping(target = "assigneeName", source = "assignee.fullName")
    @Mapping(target = "attachments", ignore = true)
    public abstract FeedbackResponse toDto(Feedback entity);

    @Override
    public Feedback toEntity(FeedbackResponse dto) {
        throw new UnsupportedOperationException("FeedbackResponse is not mapped back to Feedback");
    }
}
