package com.example.smartcity.modules.feedback.mapper;

import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.feedback.dto.FeedbackResponse;
import com.example.smartcity.modules.feedback.entity.Feedback;
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
public class FeedbackMapperImpl extends FeedbackMapper {

    @Override
    public List<FeedbackResponse> toDtoList(List<Feedback> entities) {
        if ( entities == null ) {
            return null;
        }

        List<FeedbackResponse> list = new ArrayList<FeedbackResponse>( entities.size() );
        for ( Feedback feedback : entities ) {
            list.add( toDto( feedback ) );
        }

        return list;
    }

    @Override
    public List<Feedback> toEntityList(List<FeedbackResponse> dtos) {
        if ( dtos == null ) {
            return null;
        }

        List<Feedback> list = new ArrayList<Feedback>( dtos.size() );
        for ( FeedbackResponse feedbackResponse : dtos ) {
            list.add( toEntity( feedbackResponse ) );
        }

        return list;
    }

    @Override
    public FeedbackResponse toDto(Feedback entity) {
        if ( entity == null ) {
            return null;
        }

        FeedbackResponse.FeedbackResponseBuilder feedbackResponse = FeedbackResponse.builder();

        feedbackResponse.category( entity.getCategoryName() );
        feedbackResponse.wardId( entityWardId( entity ) );
        feedbackResponse.citizenName( entityCitizenFullName( entity ) );
        feedbackResponse.citizenPhone( entityCitizenPhoneNumber( entity ) );
        feedbackResponse.citizenEmail( entityCitizenEmail( entity ) );
        feedbackResponse.citizenId( entityCitizenId( entity ) );
        feedbackResponse.assigneeName( entityAssigneeFullName( entity ) );
        feedbackResponse.id( entity.getId() );
        feedbackResponse.trackingCode( entity.getTrackingCode() );
        feedbackResponse.title( entity.getTitle() );
        feedbackResponse.description( entity.getDescription() );
        feedbackResponse.latitude( entity.getLatitude() );
        feedbackResponse.longitude( entity.getLongitude() );
        feedbackResponse.addressDetails( entity.getAddressDetails() );
        feedbackResponse.status( entity.getStatus() );
        feedbackResponse.categoryCode( entity.getCategoryCode() );
        feedbackResponse.categoryName( entity.getCategoryName() );
        feedbackResponse.managedByRole( entity.getManagedByRole() );
        feedbackResponse.priority( entity.getPriority() );
        feedbackResponse.wardName( entity.getWardName() );
        feedbackResponse.cityName( entity.getCityName() );
        feedbackResponse.assignedUnitId( entity.getAssignedUnitId() );
        feedbackResponse.assignedUnitName( entity.getAssignedUnitName() );
        feedbackResponse.assignedToRole( entity.getAssignedToRole() );
        feedbackResponse.assignedStaffId( entity.getAssignedStaffId() );
        feedbackResponse.submittedAt( entity.getSubmittedAt() );
        feedbackResponse.receivedAt( entity.getReceivedAt() );
        feedbackResponse.resolvedAt( entity.getResolvedAt() );
        feedbackResponse.createdAt( entity.getCreatedAt() );
        feedbackResponse.updatedAt( entity.getUpdatedAt() );
        feedbackResponse.publicVisible( entity.getPublicVisible() );

        return feedbackResponse.build();
    }

    private Long entityWardId(Feedback feedback) {
        if ( feedback == null ) {
            return null;
        }
        Ward ward = feedback.getWard();
        if ( ward == null ) {
            return null;
        }
        Long id = ward.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String entityCitizenFullName(Feedback feedback) {
        if ( feedback == null ) {
            return null;
        }
        User citizen = feedback.getCitizen();
        if ( citizen == null ) {
            return null;
        }
        String fullName = citizen.getFullName();
        if ( fullName == null ) {
            return null;
        }
        return fullName;
    }

    private String entityCitizenPhoneNumber(Feedback feedback) {
        if ( feedback == null ) {
            return null;
        }
        User citizen = feedback.getCitizen();
        if ( citizen == null ) {
            return null;
        }
        String phoneNumber = citizen.getPhoneNumber();
        if ( phoneNumber == null ) {
            return null;
        }
        return phoneNumber;
    }

    private String entityCitizenEmail(Feedback feedback) {
        if ( feedback == null ) {
            return null;
        }
        User citizen = feedback.getCitizen();
        if ( citizen == null ) {
            return null;
        }
        String email = citizen.getEmail();
        if ( email == null ) {
            return null;
        }
        return email;
    }

    private Long entityCitizenId(Feedback feedback) {
        if ( feedback == null ) {
            return null;
        }
        User citizen = feedback.getCitizen();
        if ( citizen == null ) {
            return null;
        }
        Long id = citizen.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String entityAssigneeFullName(Feedback feedback) {
        if ( feedback == null ) {
            return null;
        }
        User assignee = feedback.getAssignee();
        if ( assignee == null ) {
            return null;
        }
        String fullName = assignee.getFullName();
        if ( fullName == null ) {
            return null;
        }
        return fullName;
    }
}
