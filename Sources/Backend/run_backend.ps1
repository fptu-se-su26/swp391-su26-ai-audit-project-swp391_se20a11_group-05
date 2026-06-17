$env:ENCRYPTION_SECRET="my-local-dev-32-chars-secret-key"
. .\.env.local.ps1
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=supabase"
