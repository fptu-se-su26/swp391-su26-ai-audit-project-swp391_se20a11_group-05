package com.example.smartcity.modules.core.service;

import com.example.smartcity.common.exception.CustomException;
import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.core.repository.WardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.text.Normalizer;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LocationResolutionService {

    private final WardRepository wardRepository;
    private final RestTemplate restTemplate;

    @Value("${geocoding.reverse-url:https://nominatim.openstreetmap.org/reverse}")
    private String reverseUrl;

    public Ward resolveWard(double latitude, double longitude) {
        validateCoordinates(latitude, longitude);

        // Gọi reverse geocoding để suy ra phường/xã xử lý từ tọa độ GPS.
        return reverseGeocode(latitude, longitude)
                .orElseThrow(() -> new CustomException(
                        "Khong the xac dinh phuong/xa tu vi tri GPS. Vui long thu lai.",
                        HttpStatus.BAD_REQUEST.value()));
    }

    public Optional<Ward> reverseGeocode(double latitude, double longitude) {
        validateCoordinates(latitude, longitude);

        Map<?, ?> response;
        try {
            String url = UriComponentsBuilder.fromUriString(reverseUrl)
                    .queryParam("format", "jsonv2")
                    .queryParam("lat", latitude)
                    .queryParam("lon", longitude)
                    .queryParam("addressdetails", 1)
                    .toUriString();
            // Nominatim yêu cầu User-Agent rõ ràng để nhận diện ứng dụng gọi API.
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.USER_AGENT, "SmartCity/1.0");
            ResponseEntity<Map> result = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class);
            response = result.getBody();
        } catch (RestClientException ex) {
            return Optional.empty();
        }

        if (response == null) return Optional.empty();
        Object addressValue = response.get("address");
        if (!(addressValue instanceof Map<?, ?> address)) return Optional.empty();

        // Lấy các trường địa chỉ có thể chứa tên phường/xã rồi so với dữ liệu trong DB.
        return extractWardCandidates(address).stream()
                .map(this::findMatchingWard)
                .flatMap(Optional::stream)
                .findFirst();
    }

    private List<String> extractWardCandidates(Map<?, ?> address) {
        return List.of(
                value(address.get("ward")),
                value(address.get("suburb")),
                value(address.get("quarter")),
                value(address.get("neighbourhood")),
                value(address.get("village")),
                value(address.get("town"))
        ).stream().filter(s -> !s.isBlank()).toList();
    }

    private Optional<Ward> findMatchingWard(String candidate) {
        String normalizedCandidate = normalize(candidate);
        // So khớp không phân biệt dấu và bỏ tiền tố hành chính như "Phường", "Xã".
        return wardRepository.findAll().stream()
                .filter(ward -> normalize(ward.getName()).equals(normalizedCandidate)
                        || normalizedCandidate.contains(normalize(ward.getName()))
                        || normalize(ward.getName()).contains(normalizedCandidate))
                .findFirst();
    }

    private void validateCoordinates(double latitude, double longitude) {
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new CustomException("Toa do GPS khong hop le", HttpStatus.BAD_REQUEST.value());
        }
    }

    private String value(Object raw) {
        return raw instanceof String text ? text : "";
    }

    private String normalize(String text) {
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("đ", "d")
                .toLowerCase();
        return normalized
                .replace("phuong", "")
                .replace("xa", "")
                .replace("thi tran", "")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
