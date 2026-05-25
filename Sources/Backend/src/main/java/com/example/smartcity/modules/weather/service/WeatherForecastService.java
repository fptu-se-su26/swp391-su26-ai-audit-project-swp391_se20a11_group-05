package com.example.smartcity.modules.weather.service;

import com.example.smartcity.modules.weather.dto.WeatherForecastDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * WeatherForecastService
 *
 * Kết nối Open-Meteo API (miễn phí, không cần API Key) để lấy dự báo
 * thời tiết theo tọa độ trung tâm Đà Nẵng và phân tích nguy cơ sự cố đô thị.
 *
 * Open-Meteo Docs: https://open-meteo.com/en/docs
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WeatherForecastService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Inject các service nâng cấp (Features #1 & #3)
    private final BayesianRiskModelService bayesianRiskModelService;
    private final ExternalHazardService externalHazardService;

    // Tọa độ trung tâm thành phố Đà Nẵng
    private static final double DA_NANG_LAT = 16.0544;
    private static final double DA_NANG_LON = 108.2022;

    // Open-Meteo API — hoàn toàn miễn phí, không cần đăng ký
    private static final String OPEN_METEO_URL =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" + DA_NANG_LAT +
            "&longitude=" + DA_NANG_LON +
            "&hourly=temperature_2m,precipitation,windspeed_10m,relativehumidity_2m" +
            "&current_weather=true" +
            "&forecast_days=1" +
            "&timezone=Asia%2FBangkok";

    /**
     * Lấy dự báo thời tiết 24h tới + phân tích nguy cơ sự cố đô thị
     */
    @Cacheable(value = "weather", key = "'forecast'")
    public WeatherForecastDto getForecastWithRiskAnalysis() {
        WeatherForecastDto result = new WeatherForecastDto();
        try {
            String raw = restTemplate.getForObject(OPEN_METEO_URL, String.class);
            JsonNode root = objectMapper.readTree(raw);

            // ─── Parse Current Weather ────────────────────────────────
            JsonNode cw = root.path("current_weather");
            double currentTemp = cw.path("temperature").asDouble();
            double currentWind = cw.path("windspeed").asDouble();

            WeatherForecastDto.CurrentWeather current = new WeatherForecastDto.CurrentWeather(
                    currentTemp,
                    0.0, // Open-Meteo không có precipitation trong current_weather, lấy từ hourly[0]
                    currentWind,
                    0.0,
                    mapWeatherCode(cw.path("weathercode").asInt())
            );

            // ─── Parse Hourly Forecast (24h tới) ─────────────────────
            JsonNode hourly = root.path("hourly");
            JsonNode times = hourly.path("time");
            JsonNode temps = hourly.path("temperature_2m");
            JsonNode precips = hourly.path("precipitation");
            JsonNode winds = hourly.path("windspeed_10m");
            JsonNode humidities = hourly.path("relativehumidity_2m");

            List<WeatherForecastDto.HourlyForecast> hourlyList = new ArrayList<>();
            double maxPrecip = 0, maxWind = 0, maxTemp = 0, maxHumidity = 0;

            int limit = Math.min(times.size(), 24);
            for (int i = 0; i < limit; i++) {
                double p = precips.get(i).asDouble();
                double w = winds.get(i).asDouble();
                double t = temps.get(i).asDouble();
                double h = humidities.get(i).asDouble();

                maxPrecip = Math.max(maxPrecip, p);
                maxWind = Math.max(maxWind, w);
                maxTemp = Math.max(maxTemp, t);
                maxHumidity = Math.max(maxHumidity, h);

                hourlyList.add(new WeatherForecastDto.HourlyForecast(
                        times.get(i).asText(), t, p, w
                ));
            }

            // Bổ sung current precipitation từ hourly[0]
            current.setPrecipitation(precips.get(0).asDouble());
            current.setRelativeHumidity(humidities.get(0).asDouble());

            result.setCurrent(current);
            result.setNext24Hours(hourlyList);

            // ─── Lấy dữ liệu ngoại cảnh (Feature #3) ────────────────────────
            ExternalHazardService.ExternalHazardReport externalHazard = externalHazardService.collectAllHazards();

            // ─── Phân tích nguy cơ & dự đoán điểm nóng (Dùng Feature #1 & #3)
            List<WeatherForecastDto.PredictedHotspot> hotspots =
                    analyzePredictedHotspots(maxPrecip, maxWind, maxTemp, maxHumidity, externalHazard);
            result.setPredictedHotspots(hotspots);

            // ─── Tính mức cảnh báo tổng thể ──────────────────────────
            String alertLevel = computeAlertLevel(maxPrecip, maxWind, maxTemp, externalHazard);
            result.setAlertLevel(alertLevel);
            result.setAlertMessage(buildAlertMessage(alertLevel, maxPrecip, maxWind, maxTemp, externalHazard));

            log.info("[Weather] Dự báo thành công. Alert level: {} | maxPrecip={}mm | maxWind={}km/h | maxTemp={}°C",
                    alertLevel, maxPrecip, maxWind, maxTemp);

        } catch (Exception e) {
            log.error("[Weather] Lỗi kết nối Open-Meteo API: {}", e.getMessage());
            // Trả về dữ liệu fallback thay vì throw exception
            result = buildFallbackResponse();
        }
        return result;
    }

    // ─── Business Logic: Phân tích điểm nguy cơ theo phường ────────

    /**
     * Tích hợp Bayesian Model (Feature #1) và External Hazards (Feature #3) 
     * thay cho rule-based thô sơ.
     */
    private List<WeatherForecastDto.PredictedHotspot> analyzePredictedHotspots(
            double maxPrecip, double maxWind, double maxTemp, double maxHumidity,
            ExternalHazardService.ExternalHazardReport externalHazard) {

        List<WeatherForecastDto.PredictedHotspot> hotspots = new ArrayList<>();

        // Lấy ma trận rủi ro từ thuật toán Bayesian
        Map<String, Map<String, Integer>> bayesianMatrix =
                bayesianRiskModelService.computeRiskMatrix(maxPrecip, maxWind, maxTemp, maxHumidity);

        // Tọa độ cứng (chỉ dùng demo, thực tế lấy từ DB Wards)
        Map<String, double[]> wardCoords = Map.of(
                "Hải Châu",     new double[]{16.0748, 108.2218},
                "Thanh Khê",    new double[]{16.0859, 108.1891},
                "Sơn Trà",      new double[]{16.1034, 108.2435},
                "Ngũ Hành Sơn", new double[]{15.9993, 108.2625},
                "Cẩm Lệ",       new double[]{16.0015, 108.1970},
                "Liên Chiểu",   new double[]{16.0950, 108.1490}
        );

        int extRisk = externalHazard.getExternalRiskScore();

        for (Map.Entry<String, Map<String, Integer>> wardEntry : bayesianMatrix.entrySet()) {
            String wardName = wardEntry.getKey();
            Map<String, Integer> risks = wardEntry.getValue();
            double[] coords = wardCoords.getOrDefault(wardName, new double[]{16.0544, 108.2022});

            for (Map.Entry<String, Integer> riskEntry : risks.entrySet()) {
                String incidentType = riskEntry.getKey();
                int score = riskEntry.getValue();

                // Cộng gộp external risk score (tối đa 100)
                int finalScore = Math.min(100, score + (extRisk / 3));

                if (finalScore >= 40) { // Ngưỡng hiển thị (Medium trở lên)
                    String riskLevel = finalScore >= 80 ? "CRITICAL" : finalScore >= 60 ? "HIGH" : "MEDIUM";
                    String reason = generateReason(incidentType, finalScore, externalHazard);

                    hotspots.add(buildHotspot(
                            wardName, coords[0], coords[1],
                            incidentType, getIncidentLabel(incidentType),
                            riskLevel, finalScore, reason
                    ));
                }
            }
        }

        // Sắp xếp giảm dần theo điểm rủi ro
        hotspots.sort((a, b) -> Integer.compare(b.getRiskScore(), a.getRiskScore()));
        return hotspots;
    }

    private String getIncidentLabel(String incidentType) {
        return switch (incidentType) {
            case "FLOOD" -> "Ngập lụt cục bộ";
            case "FALLEN_TREE" -> "Cây xanh đổ ngã";
            case "ROAD_DAMAGE" -> "Hư hỏng hạ tầng";
            case "POWER_OUTAGE" -> "Sự cố điện/Cáp";
            default -> "Sự cố đô thị";
        };
    }

    private String generateReason(String incidentType, int score, ExternalHazardService.ExternalHazardReport ext) {
        if (incidentType.equals("FLOOD") && score > 70) return "Mô hình Bayesian chỉ ra tần suất ngập rất cao tại khu vực này trong điều kiện mưa hiện tại.";
        if (incidentType.equals("FALLEN_TREE") && score > 60) return "Nguy cơ ngã đổ do gió. " + (ext.getWaveHeightMax() > 2 ? "Sóng cao cảnh báo tác động vùng ven biển." : "");
        if (incidentType.equals("ROAD_DAMAGE") && ext.isEarthquakeDetected()) return "Phát hiện dư chấn " + ext.getEarthquakeMagnitude() + " Richter. Nguy cơ sụt lún đường.";
        if (incidentType.equals("POWER_OUTAGE") && ext.getFireHotspotCount() > 0) return "Cảnh báo an toàn điện. Có " + ext.getFireHotspotCount() + " điểm cháy/nhiệt ở vùng lân cận.";
        return "Thuật toán xác định mức rủi ro " + score + "% dựa trên lịch sử dữ liệu.";
    }

    private WeatherForecastDto.PredictedHotspot buildHotspot(
            String ward, double lat, double lon,
            String type, String label, String risk, int score, String reason) {
        WeatherForecastDto.PredictedHotspot h = new WeatherForecastDto.PredictedHotspot();
        h.setWardName(ward);
        h.setLatitude(lat);
        h.setLongitude(lon);
        h.setIncidentType(type);
        h.setIncidentLabel(label);
        h.setRiskLevel(risk);
        h.setRiskScore(score);
        h.setReason(reason);
        return h;
    }

    private String computeAlertLevel(double maxPrecip, double maxWind, double maxTemp, ExternalHazardService.ExternalHazardReport ext) {
        if (maxPrecip > 70 || maxWind > 90 || ext.getExternalRiskScore() > 60) return "DANGER";
        if (maxPrecip > 50 || maxWind > 70 || maxTemp > 40 || ext.getExternalRiskScore() > 30) return "WARNING";
        if (maxPrecip > 30 || maxWind > 55 || maxTemp > 37 || ext.getExternalRiskScore() > 10) return "WATCH";
        return "NORMAL";
    }

    private String buildAlertMessage(String level, double maxPrecip, double maxWind, double maxTemp, ExternalHazardService.ExternalHazardReport ext) {
        String baseMsg = switch (level) {
            case "DANGER"  -> String.format("🔴 NGUY HIỂM: Mưa %.0fmm, gió %.0fkm/h. Cần điều động khẩn cấp toàn bộ lực lượng cứu hộ.", maxPrecip, maxWind);
            case "WARNING" -> String.format("🟠 CẢNH BÁO: Mưa %.0fmm, gió %.0fkm/h. Triển khai trực chiến phòng chống thiên tai.", maxPrecip, maxWind);
            case "WATCH"   -> String.format("🟡 THEO DÕI: Thời tiết xấu có thể xảy ra. Mưa %.0fmm, gió %.0fkm/h, nhiệt %.1f°C.", maxPrecip, maxWind, maxTemp);
            default        -> "🟢 BÌNH THƯỜNG: Thời tiết ổn định, không có nguy cơ sự cố bất thường.";
        };

        if (ext.getExternalRiskScore() > 10) {
            baseMsg += " 🌐 Rủi ro ngoại cảnh: " + ext.getExternalRiskSummary();
        }
        return baseMsg;
    }

    private String mapWeatherCode(int code) {
        if (code == 0) return "Trời quang";
        if (code <= 3) return "Có mây";
        if (code <= 49) return "Sương mù";
        if (code <= 67) return "Có mưa";
        if (code <= 77) return "Có tuyết";
        if (code <= 82) return "Mưa rào";
        return "Dông tố";
    }

    private WeatherForecastDto buildFallbackResponse() {
        WeatherForecastDto dto = new WeatherForecastDto();
        dto.setAlertLevel("NORMAL");
        dto.setAlertMessage("⚠️ Không thể kết nối dịch vụ thời tiết. Hiển thị trạng thái bình thường mặc định.");
        dto.setCurrent(new WeatherForecastDto.CurrentWeather(28.0, 0.0, 15.0, 75.0, "Không rõ"));
        dto.setNext24Hours(new ArrayList<>());
        dto.setPredictedHotspots(new ArrayList<>());
        return dto;
    }
}
