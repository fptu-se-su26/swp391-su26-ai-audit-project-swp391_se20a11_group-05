$env:ENCRYPTION_SECRET="CHANGE_ME_32_CHARS_PLACEHOLDER!!"
$env:MAVEN_USER_HOME="$PSScriptRoot\.m2"

# Nạp biến môi trường từ file .env.local.ps1 (file này KHÔNG được commit lên Git)
# Nếu chưa có file, hãy tạo file .env.local.ps1 trong thư mục Sources/Backend/
# với nội dung mẫu từ file .env.local.ps1.example
$envFile = ".\.env.local.ps1"
if (Test-Path $envFile) {
    . $envFile
} else {
    Write-Warning "Khong tim thay file $envFile. Vui long tao file nay theo mau .env.local.ps1.example"
}

.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=supabase"

