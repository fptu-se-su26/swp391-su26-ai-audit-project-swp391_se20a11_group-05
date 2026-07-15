package com.example.smartcity.modules.notification.mapper;

import com.example.smartcity.modules.notification.dto.NotificationDTO;
import com.example.smartcity.modules.notification.entity.Notification;
import com.example.smartcity.modules.user.entity.User;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-07-15T11:11:24+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.11 (Eclipse Adoptium)"
)
@Component
public class NotificationMapperImpl implements NotificationMapper {

    @Override
    public List<NotificationDTO> toDtoList(List<Notification> entities) {
        if ( entities == null ) {
            return null;
        }

        List<NotificationDTO> list = new ArrayList<NotificationDTO>( entities.size() );
        for ( Notification notification : entities ) {
            list.add( toDto( notification ) );
        }

        return list;
    }

    @Override
    public List<Notification> toEntityList(List<NotificationDTO> dtos) {
        if ( dtos == null ) {
            return null;
        }

        List<Notification> list = new ArrayList<Notification>( dtos.size() );
        for ( NotificationDTO notificationDTO : dtos ) {
            list.add( toEntity( notificationDTO ) );
        }

        return list;
    }

    @Override
    public NotificationDTO toDto(Notification entity) {
        if ( entity == null ) {
            return null;
        }

        NotificationDTO.NotificationDTOBuilder notificationDTO = NotificationDTO.builder();

        notificationDTO.userId( entityUserId( entity ) );
        notificationDTO.feedbackId( entity.getReferenceId() );
        notificationDTO.isRead( entity.isRead() );
        notificationDTO.id( entity.getId() );
        notificationDTO.title( entity.getTitle() );
        notificationDTO.content( entity.getContent() );
        notificationDTO.type( entity.getType() );
        notificationDTO.referenceId( entity.getReferenceId() );
        notificationDTO.createdAt( entity.getCreatedAt() );

        return notificationDTO.build();
    }

    @Override
    public Notification toEntity(NotificationDTO dto) {
        if ( dto == null ) {
            return null;
        }

        Notification.NotificationBuilder notification = Notification.builder();

        notification.user( notificationDTOToUser( dto ) );
        notification.referenceId( dto.getFeedbackId() );
        notification.isRead( dto.isRead() );
        notification.title( dto.getTitle() );
        notification.content( dto.getContent() );
        notification.type( dto.getType() );
        notification.feedbackId( dto.getFeedbackId() );

        return notification.build();
    }

    private Long entityUserId(Notification notification) {
        if ( notification == null ) {
            return null;
        }
        User user = notification.getUser();
        if ( user == null ) {
            return null;
        }
        Long id = user.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    protected User notificationDTOToUser(NotificationDTO notificationDTO) {
        if ( notificationDTO == null ) {
            return null;
        }

        User user = new User();

        user.setId( notificationDTO.getUserId() );

        return user;
    }
}
