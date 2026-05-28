package com.example.smartcity.modules.police.controller;

import com.example.smartcity.common.response.ApiResponse;
import com.example.smartcity.modules.police.dto.PoliceUnitRequest;
import com.example.smartcity.modules.police.dto.PoliceUnitResponse;
import com.example.smartcity.modules.police.service.PoliceUnitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/police/units")
@RequiredArgsConstructor
public class PoliceUnitController {

    private final PoliceUnitService policeUnitService;

    /**
     * GET /api/police/units - Lấy danh sách tất cả đơn vị công an đang hoạt động
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PoliceUnitResponse>>> getAllActiveUnits() {
        List<PoliceUnitResponse> units = policeUnitService.getAllActiveUnits();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn vị công an thành công", units));
    }

    /**
     * GET /api/police/units/all - Lấy tất cả đơn vị (bao gồm cả không hoạt động)
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<PoliceUnitResponse>>> getAllUnits() {
        List<PoliceUnitResponse> units = policeUnitService.getAllUnits();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tất cả đơn vị công an thành công", units));
    }

    /**
     * GET /api/police/units/{id} - Lấy chi tiết đơn vị công an theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PoliceUnitResponse>> getUnitById(@PathVariable Long id) {
        PoliceUnitResponse unit = policeUnitService.getUnitById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin đơn vị công an thành công", unit));
    }

    /**
     * GET /api/police/units/district/{district} - Lấy đơn vị theo quận/huyện
     */
    @GetMapping("/district/{district}")
    public ResponseEntity<ApiResponse<List<PoliceUnitResponse>>> getUnitsByDistrict(@PathVariable String district) {
        List<PoliceUnitResponse> units = policeUnitService.getUnitsByDistrict(district);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn vị theo quận/huyện thành công", units));
    }

    /**
     * POST /api/police/units - Tạo mới đơn vị công an
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PoliceUnitResponse>> createUnit(@Valid @RequestBody PoliceUnitRequest request) {
        PoliceUnitResponse created = policeUnitService.createUnit(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo đơn vị công an thành công", created));
    }

    /**
     * PUT /api/police/units/{id} - Cập nhật thông tin đơn vị công an
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PoliceUnitResponse>> updateUnit(
            @PathVariable Long id,
            @Valid @RequestBody PoliceUnitRequest request) {
        PoliceUnitResponse updated = policeUnitService.updateUnit(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật đơn vị công an thành công", updated));
    }

    /**
     * PATCH /api/police/units/{id}/deactivate - Vô hiệu hóa đơn vị
     */
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateUnit(@PathVariable Long id) {
        policeUnitService.deactivateUnit(id);
        return ResponseEntity.ok(ApiResponse.success("Đã vô hiệu hóa đơn vị công an", null));
    }

    /**
     * PATCH /api/police/units/{id}/activate - Kích hoạt lại đơn vị
     */
    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activateUnit(@PathVariable Long id) {
        policeUnitService.activateUnit(id);
        return ResponseEntity.ok(ApiResponse.success("Đã kích hoạt lại đơn vị công an", null));
    }
}
