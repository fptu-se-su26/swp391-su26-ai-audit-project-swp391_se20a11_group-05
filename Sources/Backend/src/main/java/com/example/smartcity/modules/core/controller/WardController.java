package com.example.smartcity.modules.core.controller;

import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.core.repository.WardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Ward endpoints — bao gồm tìm phường theo tọa độ (geofencing)
 */
@RestController
@RequestMapping("/api/wards")
@RequiredArgsConstructor
public class WardController {

    private final WardRepository wardRepository;

    @GetMapping
    public ResponseEntity<List<Ward>> getAllWards() {
        return ResponseEntity.ok(wardRepository.findAll());
    }

    /**
     * Tìm phường theo tên (dùng cho auto-complete và geocoding)
     */
    @GetMapping("/search")
    public ResponseEntity<List<Ward>> searchByName(@RequestParam String name) {
        return ResponseEntity.ok(wardRepository.findByNameContainingIgnoreCase(name));
    }

    /**
     * Xác định phường từ tọa độ GPS (simple bounding-box geofencing)
     * TODO: Nâng cấp lên GeoJSON polygons khi có dữ liệu địa lý chi tiết
     */
    @GetMapping("/locate")
    public ResponseEntity<Ward> locateByCoordinates(
            @RequestParam double lat,
            @RequestParam double lng) {
        // Simple bounding-box fallback dùng center point gần nhất
        // FIXME: Class Ward hiện chưa có thuộc tính latitude/longitude.
        // Tạm thời trả về NotFound để build thành công.
        /*
        List<Ward> wards = wardRepository.findAll();
        Ward closest = null;
        double minDist = Double.MAX_VALUE;

        for (Ward ward : wards) {
            if (ward.getLatitude() == null || ward.getLongitude() == null) continue;
            double dist = Math.pow(lat - ward.getLatitude(), 2) + Math.pow(lng - ward.getLongitude(), 2);
            if (dist < minDist) {
                minDist = dist;
                closest = ward;
            }
        }

        if (closest != null) {
            return ResponseEntity.ok(closest);
        }
        */
        return ResponseEntity.notFound().build();
    }
}
