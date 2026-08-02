@echo off
set SUPABASE_DB_PASSWORD=thanhbinh13405@
set SUPABASE_DB_URL=jdbc:postgresql://aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?prepareThreshold=0^&sslmode=require
set SUPABASE_DB_USER=postgres.lbzcfhavzhfmeqjncsno

echo Starting backend with Supabase profile...
mvnw.cmd spring-boot:run -Dmaven.test.skip=true -Dspring-boot.run.arguments=--spring.profiles.active=supabase
