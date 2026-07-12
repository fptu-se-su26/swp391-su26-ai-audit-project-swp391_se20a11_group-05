package com.example.smartcity.modules.user.mapper;

import com.example.smartcity.common.base.BaseMapper;
import com.example.smartcity.modules.user.dto.UserDTO;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.campaign.repository.CampaignParticipantRepository;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public abstract class UserMapper implements BaseMapper<User, UserDTO> {

    @Autowired
    protected CampaignParticipantRepository campaignParticipantRepository;

    @Override
    @Mapping(target = "wardId", source = "ward.id")
    @Mapping(target = "wardName", source = "ward.name")
    @Mapping(target = "wardType", source = "ward.type")
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "isMfaEnabled", source = "mfaEnabled")
    @Mapping(target = "isCampaignBanned", source = "campaignBanned")
    @Mapping(target = "completedCampaignCount", expression = "java(countCompletedCampaigns(entity))")
    @Mapping(target = "noShowCampaignCount", expression = "java(countNoShowCampaigns(entity))")
    @Mapping(target = "reputationBadge", expression = "java(determineReputationBadge(countCompletedCampaigns(entity)))")
    public abstract UserDTO toDto(User entity);

    protected int countCompletedCampaigns(User entity) {
        if (entity == null || entity.getId() == null) return 0;
        return (int) campaignParticipantRepository.countByCitizen_IdAndAttendedTrue(entity.getId());
    }

    protected int countNoShowCampaigns(User entity) {
        if (entity == null || entity.getId() == null) return 0;
        return (int) campaignParticipantRepository.countNoShowCampaigns(entity.getId());
    }

    protected String determineReputationBadge(int completedCampaigns) {
        if (completedCampaigns >= 10) {
            return "Đại sứ Vì cộng đồng";
        } else if (completedCampaigns >= 5) {
            return "Trụ cột Cộng đồng";
        } else if (completedCampaigns >= 1) {
            return "Thành viên Năng nổ";
        } else {
            return "Tình nguyện viên Mới";
        }
    }
}
