package com.example.smartcity.modules.weather.dto;

import java.util.List;

/**
 * DTO trả về cho Frontend: Dự báo thời tiết + Danh sách điểm nguy cơ dự đoán
 */
public class WeatherForecastDto {

    private CurrentWeather current;
    private List<HourlyForecast> next24Hours;
    private List<PredictedHotspot> predictedHotspots;
    private String alertLevel;   // "NORMAL" | "WATCH" | "WARNING" | "DANGER"
    private String alertMessage;

    public WeatherForecastDto() {}

    // ─── Inner classes ─────────────────────────────────────────────

    public static class CurrentWeather {
        private double temperature;
        private double precipitation;
        private double windspeed;
        private double relativeHumidity;
        private String weatherDescription;

        public CurrentWeather() {}
        public CurrentWeather(double temperature, double precipitation, double windspeed,
                              double relativeHumidity, String weatherDescription) {
            this.temperature = temperature;
            this.precipitation = precipitation;
            this.windspeed = windspeed;
            this.relativeHumidity = relativeHumidity;
            this.weatherDescription = weatherDescription;
        }

        public double getTemperature() { return temperature; }
        public void setTemperature(double temperature) { this.temperature = temperature; }
        public double getPrecipitation() { return precipitation; }
        public void setPrecipitation(double precipitation) { this.precipitation = precipitation; }
        public double getWindspeed() { return windspeed; }
        public void setWindspeed(double windspeed) { this.windspeed = windspeed; }
        public double getRelativeHumidity() { return relativeHumidity; }
        public void setRelativeHumidity(double relativeHumidity) { this.relativeHumidity = relativeHumidity; }
        public String getWeatherDescription() { return weatherDescription; }
        public void setWeatherDescription(String weatherDescription) { this.weatherDescription = weatherDescription; }
    }

    public static class HourlyForecast {
        private String time;
        private double temperature;
        private double precipitation;
        private double windspeed;

        public HourlyForecast() {}
        public HourlyForecast(String time, double temperature, double precipitation, double windspeed) {
            this.time = time;
            this.temperature = temperature;
            this.precipitation = precipitation;
            this.windspeed = windspeed;
        }

        public String getTime() { return time; }
        public void setTime(String time) { this.time = time; }
        public double getTemperature() { return temperature; }
        public void setTemperature(double temperature) { this.temperature = temperature; }
        public double getPrecipitation() { return precipitation; }
        public void setPrecipitation(double precipitation) { this.precipitation = precipitation; }
        public double getWindspeed() { return windspeed; }
        public void setWindspeed(double windspeed) { this.windspeed = windspeed; }
    }

    public static class PredictedHotspot {
        private String wardName;
        private double latitude;
        private double longitude;
        private String incidentType;     // "FLOOD" | "FALLEN_TREE" | "ROAD_DAMAGE" | "POWER_OUTAGE"
        private String incidentLabel;    // Label tiếng Việt
        private String riskLevel;        // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
        private int riskScore;           // 0-100
        private String reason;           // Lý do dự đoán

        public PredictedHotspot() {}

        public String getWardName() { return wardName; }
        public void setWardName(String wardName) { this.wardName = wardName; }
        public double getLatitude() { return latitude; }
        public void setLatitude(double latitude) { this.latitude = latitude; }
        public double getLongitude() { return longitude; }
        public void setLongitude(double longitude) { this.longitude = longitude; }
        public String getIncidentType() { return incidentType; }
        public void setIncidentType(String incidentType) { this.incidentType = incidentType; }
        public String getIncidentLabel() { return incidentLabel; }
        public void setIncidentLabel(String incidentLabel) { this.incidentLabel = incidentLabel; }
        public String getRiskLevel() { return riskLevel; }
        public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
        public int getRiskScore() { return riskScore; }
        public void setRiskScore(int riskScore) { this.riskScore = riskScore; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    // ─── Root getters/setters ──────────────────────────────────────

    public CurrentWeather getCurrent() { return current; }
    public void setCurrent(CurrentWeather current) { this.current = current; }
    public List<HourlyForecast> getNext24Hours() { return next24Hours; }
    public void setNext24Hours(List<HourlyForecast> next24Hours) { this.next24Hours = next24Hours; }
    public List<PredictedHotspot> getPredictedHotspots() { return predictedHotspots; }
    public void setPredictedHotspots(List<PredictedHotspot> predictedHotspots) { this.predictedHotspots = predictedHotspots; }
    public String getAlertLevel() { return alertLevel; }
    public void setAlertLevel(String alertLevel) { this.alertLevel = alertLevel; }
    public String getAlertMessage() { return alertMessage; }
    public void setAlertMessage(String alertMessage) { this.alertMessage = alertMessage; }
}
