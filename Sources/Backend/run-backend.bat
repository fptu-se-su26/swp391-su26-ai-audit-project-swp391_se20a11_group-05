@echo off
cd /d "%~dp0"
echo Starting Spring Boot Backend...
call mvnw.cmd spring-boot:run
