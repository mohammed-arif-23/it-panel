# Firebase Storage Setup

This application now uses Firebase Storage for file uploads instead of Supabase Storage, while maintaining Supabase for database operations.

## Required Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Existing Supabase Configuration (keep these for database operations)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Firebase Project Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project" or use an existing project
   - Follow the setup wizard

2. **Enable Firebase Storage**:
   - In your Firebase project console, go to "Storage"
   - Click "Get started"
   - Choose "Start in test mode" for development
   - Select a location for your Cloud Storage bucket

3. **Get Configuration Values**:
   - Go to Project Settings (gear icon) → General tab
   - In the "Your apps" section, click the web app icon (`</>`)
   - Register your app with a nickname
   - Copy the configuration values to your `.env.local` file

4. **Configure Storage Rules** (Optional for production):
   ```javascript
   // Firebase Storage Rules (for production)
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /assignments/{allPaths=**} {
         allow read, write: if request.time < timestamp.date(2025, 12, 31);
       }
     }
   }
   ```

## Benefits of Firebase Storage

- **Generous Free Tier**: 5GB storage and 1GB per day download bandwidth
- **Better Performance**: Global CDN for faster file access
- **Scalability**: Automatic scaling as your application grows
- **Security**: Built-in security rules and authentication integration

## File Storage Structure

Files are organized in Firebase Storage as:
```
assignments/
  ├── studentId_assignmentId_timestamp.pdf
  ├── studentId_assignmentId_timestamp.docx
  └── ...
```

## Database Integration

- File URLs from Firebase are stored in Supabase's `assignment_submissions` table
- The `file_url` column contains the Firebase download URL
- All other data (assignments, students, submissions metadata) remains in Supabase

## Migration Notes

- Existing files in Supabase Storage will remain accessible
- New uploads automatically go to Firebase Storage
- No changes needed to the frontend - file uploads work the same way
- File downloads use the URLs stored in the database (Firebase URLs for new files)