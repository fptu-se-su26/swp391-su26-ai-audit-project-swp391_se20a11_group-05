package com.example.smartcity.modules.police.service;

import com.example.smartcity.modules.police.dto.PoliceUnitRequest;
import com.example.smartcity.modules.police.dto.PoliceUnitResponse;
import com.example.smartcity.modules.police.entity.PoliceUnit;
import com.example.smartcity.modules.police.repository.PoliceUnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PoliceUnitService {

    private final PoliceUnitRepository policeUnitRepository;

    /**
     * Lấy danh sách tất cả đơn vị công an đang hoạt động
     */
    public List<PoliceUnitResponse> getAllActiveUnits() {
        return policeUnitRepository.findByActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách tất cả đơn vị công an (bao gồm cả không hoạt động)
     */
    public List<PoliceUnitResponse> getAllUnits() {
        return policeUnitRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy thông tin đơn vị công an theo ID
     */
    public PoliceUnitResponse getUnitById(Long id) {
        PoliceUnit unit = policeUnitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn vị công an với ID: " + id));
        return toResponse(unit);
    }

    /**
     * Lấy danh sách đơn vị công an theo quận/huyện
     */
    public List<PoliceUnitResponse> getUnitsByDistrict(String district) {
        return policeUnitRepository.findByDistrictAndActiveTrue(district)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Tạo mới đơn vị công an
     */
    @Transactional
    public PoliceUnitResponse createUnit(PoliceUnitRequest request) {
        if (policeUnitRepository.existsByUnitCode(request.getUnitCode())) {
            throw new RuntimeException("Mã đơn vị đã tồn tại: " + request.getUnitCode());
        }

        PoliceUnit unit = PoliceUnit.builder()
                .unitName(request.getUnitName())
                .unitCode(request.getUnitCode())
                .address(request.getAddress())
                .phone(request.getPhone())
                .email(request.getEmail())
                .district(request.getDistrict())
                .ward(request.getWard())
                .description(request.getDescription())
                .active(true)
                .build();

        PoliceUnit saved = policeUnitRepository.save(unit);
        return toResponse(saved);
    }

    /**
     * Cập nhật thông tin đơn vị công an
     */
    @Transactional
    public PoliceUnitResponse updateUnit(Long id, PoliceUnitRequest request) {
        PoliceUnit unit = policeUnitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn vị công an với ID: " + id));

        unit.setUnitName(request.getUnitName());
        unit.setAddress(request.getAddress());
        unit.setPhone(request.getPhone());
        unit.setEmail(request.getEmail());
        unit.setDistrict(request.getDistrict());
        unit.setWard(request.getWard());
        unit.setDescription(request.getDescription());

        PoliceUnit saved = policeUnitRepository.save(unit);
        return toResponse(saved);
    }

    /**
     * Vô hiệu hóa đơn vị công an (soft delete)
     */
    @Transactional
    public void deactivateUnit(Long id) {
        PoliceUnit unit = policeUnitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn vị công an với ID: " + id));
        unit.setActive(false);
        policeUnitRepository.save(unit);
    }

    /**
     * Kích hoạt lại đơn vị công an
     */
    @Transactional
    public void activateUnit(Long id) {
        PoliceUnit unit = policeUnitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn vị công an với ID: " + id));
        unit.setActive(true);
        policeUnitRepository.save(unit);
    }

    /**
     * Chuyển Entity sang DTO Response
     */
    private PoliceUnitResponse toResponse(PoliceUnit unit) {
        return PoliceUnitResponse.builder()
                .id(unit.getId())
                .unitName(unit.getUnitName())
                .unitCode(unit.getUnitCode())
                .address(unit.getAddress())
                .phone(unit.getPhone())
                .email(unit.getEmail())
                .district(unit.getDistrict())
                .ward(unit.getWard())
                .description(unit.getDescription())
                .active(unit.getActive())
                .createdAt(unit.getCreatedAt())
                .updatedAt(unit.getUpdatedAt())
                .build();
    }
}
