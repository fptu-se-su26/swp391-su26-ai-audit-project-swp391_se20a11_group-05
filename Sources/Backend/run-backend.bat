@echo off
cd /d "%~dp0"
echo Starting Spring Boot Backend...
call mvn spring-boot:run
