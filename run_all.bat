@echo off
echo ========================================================
echo        DA NANG SMART CITY - DEVELOPMENT RUNNER
echo ========================================================
echo.

echo [1/2] Đang khởi động Backend (Spring Boot) ở cửa sổ mới...
start "SmartCity Backend" cmd /k "cd Sources\Backend && mvnw.cmd spring-boot:run"

echo [2/2] Đang khởi động Frontend (React) ở cửa sổ mới...
start "SmartCity Frontend" cmd /k "cd Sources\Frontend && npm run dev"

echo.
echo Hoan tat! Hai cua so moi da duoc mo de chay server.
echo - Backend se chay tren cong :8080 hoac :8081
echo - Frontend se chay tren cong :5173
echo.
pause
