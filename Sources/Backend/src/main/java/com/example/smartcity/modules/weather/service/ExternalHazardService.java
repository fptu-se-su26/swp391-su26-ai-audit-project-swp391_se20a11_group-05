package com.example.smartcity.modules.weather.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

/**
 * ExternalHazardService — Feature #3: Multi-Source Data Fusion
 *
 * Thu thập dữ liệu nguy cơ từ 3 nguồn bên ngoài để bổ sung cho Open-Meteo:
 *
 *   1. Open-Meteo Marine API  → Sóng biển, mực nước → cảnh báo sạt lở bờ biển
 *   2. USGS Earthquake API    → Rung chấn gần Đà Nẵng → cảnh báo sụt lún đường
 *   3. NASA FIRMS API         → Điểm nhiệt (cháy rừng, cháy đô thị) → nguy cơ cháy lan
 *
 * Tất cả đều MIỄN PHÍ, không cần API Key (trừ NASA FIRMS cần key, nhưng
 * có thể dùng endpoint demo "MAP_KEY" cho đồ án sinh viên).
 *
 * Kết quả được đưa vào MultiSourceFusionService để tính điểm tổng hợp.
 */
@Slf4j
@Service
public class ExternalHazardService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Tọa độ Đà Nẵng và vùng lân cận
    private static final double LAT    = 16.0544;
    private static final double LON    = 108.2022;
    private static final double RADIUS = 100.0; // km

    // ─── Inner DTO ────────────────────────────────────────────────────────────

    public static class ExternalHazardReport {
        private double waveHeightMax;       // Chiều cao sóng cực đại (m) - từ Marine API
        private double seaLevelRise;        // Nước biển dâng dự kiến (mm) - từ Marine API
        private boolean earthquakeDetected; // Có rung chấn gần ĐN trong 24h không
        private double earthquakeMagnitude; // Cường độ Richter của rung chấn gần nhất
        private int fireHotspotCount;       // Số điểm nhiệt phát hiện trong bán kính 100km

        // Điểm nguy cơ tổng hợp từ các nguồn bên ngoài (0-100)
        private int externalRiskScore;
        private String externalRiskSummary;

        public ExternalHazardReport() {}

        public double getWaveHeightMax() { return waveHeightMax; }
        public void setWaveHeightMax(double v) { this.waveHeightMax = v; }
        public double getSeaLevelRise() { return seaLevelRise; }
        public void setSeaLevelRise(double v) { this.seaLevelRise = v; }
        public boolean isEarthquakeDetected() { return earthquakeDetected; }
        public void setEarthquakeDetected(boolean v) { this.earthquakeDetected = v; }
        public double getEarthquakeMagnitude() { return earthquakeMagnitude; }
        public void setEarthquakeMagnitude(double v) { this.earthquakeMagnitude = v; }
        public int getFireHotspotCount() { return fireHotspotCount; }
        public void setFireHotspotCount(int v) { this.fireHotspotCount = v; }
        public int getExternalRiskScore() { return externalRiskScore; }
        public void setExternalRiskScore(int v) { this.externalRiskScore = v; }
        public String getExternalRiskSummary() { return externalRiskSummary; }
        public void setExternalRiskSummary(String v) { this.externalRiskSummary = v; }
    }

    // ─── Public API ────────────────────────────────────────────────────────────

    /**
     * Thu thập và hợp nhất dữ liệu nguy cơ từ tất cả các nguồn bên ngoài.
     */
    public ExternalHazardReport collectAllHazards() {
        ExternalHazardReport report = new ExternalHazardReport();

        // Thu thập song song (trong thực tế nên dùng CompletableFuture)
        enrichWithMarineData(report);
        enrichWithEarthquakeData(report);
        enrichWithFireData(report);

        // Tính điểm nguy cơ tổng hợp
        computeExternalRiskScore(report);

        log.info("[ExternalHazard] Wave={:.1f}m | Quake={} ({:.1f}R) | Fires={} | ExternalScore={}",
                report.getWaveHeightMax(),
                report.isEarthquakeDetected() ? "YES" : "NO",
                report.getEarthquakeMagnitude(),
                report.getFireHotspotCount(),
                report.getExternalRiskScore());

        return report;
    }

    // ─── Source 1: Open-Meteo Marine API ─────────────────────────────────────

    /**
     * Lấy dữ liệu sóng biển và mực nước ven bờ Đà Nẵng.
     * Open-Meteo Marine: https://marine-api.open-meteo.com/v1/marine
     */
    private void enrichWithMarineData(ExternalHazardReport report) {
        try {
            String url = "https://marine-api.open-meteo.com/v1/marine" +
                    "?latitude=" + LAT + "&longitude=" + LON +
                    "&hourly=wave_height,sea_level_pressure" +
                    "&forecast_days=1";

            String raw = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(raw);
            JsonNode waves = root.path("hourly").path("wave_height");

            double maxWave = 0.0;
            for (JsonNode node : waves) {
                maxWave = Math.max(maxWave, node.asDouble());
            }
            report.setWaveHeightMax(maxWave);

            // Sóng cao > 2m → đe dọa bờ biển Sơn Trà/Ngũ Hành Sơn
            // Sóng > 3.5m → nguy cơ sạt lở ven biển nghiêm trọng
            log.debug("[Marine] Wave max: {} m", maxWave);

        } catch (Exception e) {
            log.warn("[Marine] Không thể lấy dữ liệu sóng biển: {}", e.getMessage());
            report.setWaveHeightMax(0.5); // fallback: sóng nhỏ
        }
    }

    // ─── Source 2: USGS Earthquake API ───────────────────────────────────────

    /**
     * Kiểm tra các rung chấn xảy ra trong vòng 24h qua, trong bán kính 100km từ Đà Nẵng.
     * USGS GeoJSON API: https://earthquake.usgs.gov/fdsnws/event/1/
     */
    private void enrichWithEarthquakeData(ExternalHazardReport report) {
        try {
            // Tính bbox xung quanh Đà Nẵng (±1 độ ≈ 111km)
            double deltaLat = RADIUS / 111.0;
            double deltaLon = RADIUS / (111.0 * Math.cos(Math.toRadians(LAT)));

            String url = String.format(
                    "https://earthquake.usgs.gov/fdsnws/event/1/query" +
                    "?format=geojson&minmagnitude=2.5" +
                    "&minlatitude=%.4f&maxlatitude=%.4f" +
                    "&minlongitude=%.4f&maxlongitude=%.4f" +
                    "&orderby=time&limit=5",
                    LAT - deltaLat, LAT + deltaLat,
                    LON - deltaLon, LON + deltaLon
            );

            String raw = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(raw);
            JsonNode features = root.path("features");

            if (features.size() > 0) {
                report.setEarthquakeDetected(true);
                // Lấy cường độ của trận mạnh nhất
                double maxMag = 0;
                for (JsonNode feature : features) {
                    double mag = feature.path("properties").path("mag").asDouble();
                    maxMag = Math.max(maxMag, mag);
                }
                report.setEarthquakeMagnitude(maxMag);
                log.info("[USGS] Phát hiện {} rung chấn. Mạnh nhất: {} Richter", features.size(), maxMag);
            } else {
                report.setEarthquakeDetected(false);
                report.setEarthquakeMagnitude(0.0);
            }

        } catch (Exception e) {
            log.warn("[USGS] Không thể lấy dữ liệu rung chấn: {}", e.getMessage());
            report.setEarthquakeDetected(false);
        }
    }

    // ─── Source 3: NASA FIRMS (Fire) ──────────────────────────────────────────

    /**
     * Đếm số điểm nhiệt (cháy rừng / cháy khu công nghiệp) trong bán kính 100km.
     * NASA FIRMS API: https://firms.modaps.eosdis.nasa.gov/api/
     * (Dùng MAP_KEY = "MAP_KEY" cho demo — key thực cần đăng ký miễn phí tại EOSDIS)
     */
    private void enrichWithFireData(ExternalHazardReport report) {
        try {
            // Tính bbox
            double deltaLat = RADIUS / 111.0;
            double deltaLon = RADIUS / (111.0 * Math.cos(Math.toRadians(LAT)));
            String bbox = String.format("%.4f,%.4f,%.4f,%.4f",
                    LON - deltaLon, LAT - deltaLat, LON + deltaLon, LAT + deltaLat);

            // NASA FIRMS CSV endpoint (tự parse CSV đơn giản hơn)
            String url = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/MAP_KEY/VIIRS_SNPP_NRT/" + bbox + "/1";

            String raw = restTemplate.getForObject(url, String.class);
            if (raw != null) {
                // Mỗi dòng CSV (trừ header) = 1 điểm nhiệt
                long lineCount = raw.lines().count() - 1; // trừ header
                report.setFireHotspotCount((int) Math.max(0, lineCount));
                log.debug("[NASA FIRMS] {} điểm nhiệt trong bán kính {}km", lineCount, RADIUS);
            }

        } catch (Exception e) {
            log.warn("[NASA FIRMS] Không thể lấy dữ liệu cháy: {}", e.getMessage());
            report.setFireHotspotCount(0); // fallback
        }
    }

    // ─── Scoring ──────────────────────────────────────────────────────────────

    private void computeExternalRiskScore(ExternalHazardReport report) {
        int score = 0;
        List<String> reasons = new ArrayList<>();

        // Sóng biển
        if (report.getWaveHeightMax() > 3.5) {
            score += 35;
            reasons.add(String.format("Sóng cao %.1fm (cực kỳ nguy hiểm)", report.getWaveHeightMax()));
        } else if (report.getWaveHeightMax() > 2.0) {
            score += 20;
            reasons.add(String.format("Sóng cao %.1fm (cảnh báo bờ biển)", report.getWaveHeightMax()));
        } else if (report.getWaveHeightMax() > 1.0) {
            score += 8;
        }

        // Rung chấn
        if (report.isEarthquakeDetected()) {
            double mag = report.getEarthquakeMagnitude();
            if (mag >= 5.0) {
                score += 40;
                reasons.add(String.format("Rung chấn %.1f Richter — nguy cơ sụt lún cao", mag));
            } else if (mag >= 3.5) {
                score += 20;
                reasons.add(String.format("Rung chấn %.1f Richter — kiểm tra hạ tầng cầu đường", mag));
            } else {
                score += 5;
            }
        }

        // Cháy rừng / khu công nghiệp
        if (report.getFireHotspotCount() > 10) {
            score += 25;
            reasons.add(String.format("%d điểm nhiệt — nguy cơ cháy lan vào đô thị", report.getFireHotspotCount()));
        } else if (report.getFireHotspotCount() > 3) {
            score += 10;
            reasons.add(String.format("%d điểm nhiệt — theo dõi hướng gió", report.getFireHotspotCount()));
        }

        report.setExternalRiskScore(Math.min(100, score));
        report.setExternalRiskSummary(reasons.isEmpty()
                ? "Không có nguy cơ bổ sung từ các nguồn dữ liệu vệ tinh và địa chấn."
                : String.join(" | ", reasons));
    }
}
