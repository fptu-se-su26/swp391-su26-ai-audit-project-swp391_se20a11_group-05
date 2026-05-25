package com.example.smartcity.modules.notification.mapper;

import com.example.smartcity.common.base.BaseMapper;
import com.example.smartcity.modules.notification.dto.NotificationDTO;
import com.example.smartcity.modules.notification.entity.Notification;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface NotificationMapper extends BaseMapper<Notification, NotificationDTO> {

    @Override
    @Mapping(source = "user.id", target = "userId")
    NotificationDTO toDto(Notification entity);

    @Override
    @Mapping(source = "userId", target = "user.id")
    Notification toEntity(NotificationDTO dto);
}
