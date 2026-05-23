package com.example.smartcity.modules.user.controller;

import com.example.smartcity.common.base.BaseGenericController;
import com.example.smartcity.common.base.BaseMapper;
import com.example.smartcity.common.base.BaseService;
import com.example.smartcity.modules.user.dto.UserDTO;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.user.mapper.UserMapper;
import com.example.smartcity.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController extends BaseGenericController<User, UserDTO, Long> {

    private final UserService userService;
    private final UserMapper userMapper;

    @Override
    protected BaseService<User, Long> getService() {
        return userService;
    }

    @Override
    protected BaseMapper<User, UserDTO> getMapper() {
        return userMapper;
    }
}
