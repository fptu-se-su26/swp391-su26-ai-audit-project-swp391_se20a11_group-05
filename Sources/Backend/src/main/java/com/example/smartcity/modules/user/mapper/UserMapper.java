package com.example.smartcity.modules.user.mapper;

import com.example.smartcity.common.base.BaseMapper;
import com.example.smartcity.modules.user.dto.UserDTO;
import com.example.smartcity.modules.user.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface UserMapper extends BaseMapper<User, UserDTO> {
}
