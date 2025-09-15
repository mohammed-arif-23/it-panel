# Password Verification System

## Overview

The password verification system allows students to set and verify passwords for their accounts. The system uses OTP (One-Time Password) sent to the student's registered email for verification.

## How It Works

### 1. Generate OTP
- Student enters their register number on the `/verify` page
- System checks if the student exists in the database
- If student exists and has a valid email, an OTP is generated and sent to their email
- OTP is stored in memory with a 10-minute expiration time

### 2. Verify OTP and Set Password
- Student enters the OTP received in their email
- Student enters their desired password and confirms it
- System verifies the OTP and checks password requirements
- If everything is valid, the password is stored directly in the database (without hashing)

### 3. Login with Password
- When student logs in, if they have a password set, they must provide it
- System compares the provided password with the stored password directly
- If passwords match, student is logged in

## Security Notes

⚠️ **Important**: Passwords are stored directly in the database without hashing. This is a security risk and should only be used in development or if specifically required.

## API Endpoints

### POST `/api/verify`

#### Generate OTP
```json
{
  "action": "generate",
  "registerNumber": "student_register_number"
}
```

#### Verify OTP and Set Password
```json
{
  "action": "verify",
  "registerNumber": "student_register_number",
  "otp": "123456",
  "password": "student_password",
  "confirmPassword": "student_password"
}
```

## Database Schema

The password is stored in the `unified_students` table in the `password` column:

```sql
CREATE TABLE IF NOT EXISTS unified_students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    register_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(15),
    class_year VARCHAR(10),
    password TEXT, -- For password verification feature
    email_verified BOOLEAN DEFAULT false,
    total_fine_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Frontend Components

### Login Page (`/`)
- Shows a password field when student has a password set
- Validates password during login

### Verify Page (`/verify`)
- Two-step process:
  1. Enter register number to receive OTP
  2. Enter OTP and set password

## Testing

To test the system, you can use the PowerShell script `test-password-verification.ps1` which uses `Invoke-WebRequest` to test the API endpoints.