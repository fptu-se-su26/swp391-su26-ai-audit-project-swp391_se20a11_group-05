$env:ENCRYPTION_SECRET="my-local-dev-32-chars-secret-key"

$envFile = ".\.env.local.ps1"
if (Test-Path $envFile) {
    . $envFile
} else {
    Write-Warning "Khong tim thay file $envFile. Vui long tao file nay theo mau .env.local.ps1.example"
}

.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=supabase"
