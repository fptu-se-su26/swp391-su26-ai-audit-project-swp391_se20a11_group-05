package com.example.smartcity.modules.user.mapper;

import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.user.dto.UserDTO;
import com.example.smartcity.modules.user.entity.User;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-07-15T10:40:23+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.11 (Eclipse Adoptium)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public User toEntity(UserDTO dto) {
        if ( dto == null ) {
            return null;
        }

        User user = new User();

        user.setId( dto.getId() );
        user.setUsername( dto.getUsername() );
        user.setFullName( dto.getFullName() );
        user.setPhoneNumber( dto.getPhoneNumber() );
        user.setEmail( dto.getEmail() );
        user.setRole( dto.getRole() );
        user.setActive( dto.isActive() );
        user.setMfaEnabled( dto.isMfaEnabled() );

        return user;
    }

    @Override
    public List<UserDTO> toDtoList(List<User> entities) {
        if ( entities == null ) {
            return null;
        }

        List<UserDTO> list = new ArrayList<UserDTO>( entities.size() );
        for ( User user : entities ) {
            list.add( toDto( user ) );
        }

        return list;
    }

    @Override
    public List<User> toEntityList(List<UserDTO> dtos) {
        if ( dtos == null ) {
            return null;
        }

        List<User> list = new ArrayList<User>( dtos.size() );
        for ( UserDTO userDTO : dtos ) {
            list.add( toEntity( userDTO ) );
        }

        return list;
    }

    @Override
    public UserDTO toDto(User entity) {
        if ( entity == null ) {
            return null;
        }

        UserDTO.UserDTOBuilder userDTO = UserDTO.builder();

        userDTO.wardId( entityWardId( entity ) );
        userDTO.id( entity.getId() );
        userDTO.username( entity.getUsername() );
        userDTO.fullName( entity.getFullName() );
        userDTO.phoneNumber( entity.getPhoneNumber() );
        userDTO.email( entity.getEmail() );
        userDTO.role( entity.getRole() );

        return userDTO.build();
    }

    private Long entityWardId(User user) {
        if ( user == null ) {
            return null;
        }
        Ward ward = user.getWard();
        if ( ward == null ) {
            return null;
        }
        Long id = ward.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }
}
