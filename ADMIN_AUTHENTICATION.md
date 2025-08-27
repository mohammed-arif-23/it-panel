# Admin Panel Authentication Setup

## Overview
The admin panel uses username and password authentication with credentials stored in environment variables for security.

## Environment Variables Required

Add these variables to your `.env.local` file:

```bash
# Admin Authentication Credentials
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password

# Example:
ADMIN_USERNAME=admin
ADMIN_PASSWORD=MySecureAdminPassword123!
```

## Features

### 🔐 Secure Authentication
- Username and password validation against environment variables
- HTTP-only cookies for session management
- Automatic session expiration (24 hours)
- Secure cookie settings in production

### 🎨 User Interface
- Professional login form with icons
- Real-time form validation
- Loading states during authentication
- Clear error messages for failed attempts
- Responsive design for all devices

### 🔒 Session Management
- Automatic session checking on page load
- Secure logout functionality
- Cookie-based authentication
- Session persistence across browser sessions

## Usage

1. **Setup Environment Variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and set your admin credentials
   ```

2. **Access Admin Panel**
   - Navigate to `/admin`
   - Enter your username and password
   - Click "Sign In"

3. **Security Features**
   - Sessions automatically expire after 24 hours
   - Secure cookies in production environment
   - HTTP-only cookies prevent XSS attacks

## API Endpoints

### POST `/api/admin/auth`
Authenticates admin credentials and creates session.

**Request:**
```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true
}
```

### GET `/api/admin/auth`
Checks current authentication status.

**Response:**
```json
{
  "authenticated": true
}
```

### POST `/api/admin/logout`
Logs out admin and clears session.

**Response:**
```json
{
  "success": true
}
```

## Security Considerations

- **Strong Passwords**: Use complex passwords with letters, numbers, and symbols
- **Environment Security**: Never commit `.env.local` to version control
- **HTTPS**: Always use HTTPS in production
- **Regular Updates**: Change admin credentials periodically

## Troubleshooting

### Invalid Credentials Error
- Verify environment variables are set correctly
- Check for typos in username/password
- Ensure `.env.local` file is in the project root

### Session Issues
- Clear browser cookies and try again
- Check if cookies are enabled in browser
- Verify secure cookie settings in production

### Development vs Production
- Development: Cookies work over HTTP
- Production: Requires HTTPS for secure cookies