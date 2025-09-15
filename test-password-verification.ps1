# PowerShell script to test the password verification system

Write-Host "Testing Password Verification System" -ForegroundColor Green

# Test 1: Generate OTP
Write-Host "`nTest 1: Generating OTP for a student" -ForegroundColor Yellow

# Replace with an actual register number from your database
$registerNumber = "620123205015"

$body = @{
    action = "generate"
    registerNumber = $registerNumber
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/verify" -Method POST -Body $body -ContentType "application/json"
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "✓ OTP Generation Successful: $($result.message)" -ForegroundColor Green
    } else {
        Write-Host "✗ OTP Generation Failed: $($result.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error during OTP generation: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Verify OTP and Set Password
Write-Host "`nTest 2: Verifying OTP and Setting Password" -ForegroundColor Yellow

# Replace with the actual OTP sent to the student's email
$otp = "123456"
$password = "testpassword123"

$body = @{
    action = "verify"
    registerNumber = $registerNumber
    otp = $otp
    password = $password
    confirmPassword = $password
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/verify" -Method POST -Body $body -ContentType "application/json"
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "✓ Password Set Successfully: $($result.message)" -ForegroundColor Green
    } else {
        Write-Host "✗ Password Set Failed: $($result.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error during password verification: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest Complete" -ForegroundColor Green