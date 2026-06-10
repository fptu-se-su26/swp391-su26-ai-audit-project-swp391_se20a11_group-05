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
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "citizenName", source = "citizen.fullName")
    @Mapping(target = "assigneeName", source = "assignee.fullName")
    @Mapping(target = "attachments", expression = "java(mapAttachments(entity))")
    public abstract FeedbackResponse toDto(Feedback entity);

    protected List<FeedbackAttachmentResponse> mapAttachments(Feedback feedback) {
        if (feedback == null || feedback.getId() == null) {
            return List.of();
        }

        return attachmentRepository.findByFeedbackId(feedback.getId()).stream()
                .map(this::toAttachmentResponse)
                .toList();
    }

    private FeedbackAttachmentResponse toAttachmentResponse(Attachment attachment) {
        return FeedbackAttachmentResponse.builder()
                .id(attachment.getId())
                .fileUrl(attachment.getFileUrl())
                .fileType(attachment.getFileType())
                .uploadedAt(attachment.getUploadedAt())
                .build();
    }
    
    // We don't map back from Response to Entity usually, so we can ignore it or leave default
}
