$env:ENCRYPTION_SECRET="CHANGE_ME_32_CHARS_PLACEHOLDER!!"
$env:MAVEN_USER_HOME="$PSScriptRoot\.m2"

$envFile = ".\.env.local.ps1"
if (Test-Path $envFile) {
    . $envFile
} else {
    Write-Warning "Khong tim thay file $envFile. Vui long tao file nay theo mau .env.local.ps1.example"
}

mvn spring-boot:run "-Dspring-boot.run.profiles=supabase"

