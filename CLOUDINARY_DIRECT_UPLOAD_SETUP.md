# Cloudinary Direct Upload Setup

This project now uses **Direct Cloudinary Upload** to bypass server file size limits. Files are uploaded directly from the frontend to Cloudinary, then the URL is saved to the database.

## 🚀 Benefits

- ✅ **No file size limits** (up to 100MB vs previous 9MB)
- ✅ **Faster uploads** (direct to Cloudinary CDN)
- ✅ **Progress tracking** with real-time upload percentage
- ✅ **Better user experience** with visual feedback
- ✅ **Reduced server load** (no file processing on Vercel)

## 🔧 Environment Variables Required

Add these to your `.env.local` file:

```env
# Existing Cloudinary variables (keep these)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# New variable for direct uploads
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=assignments_unsigned
```

## ⚙️ Cloudinary Dashboard Setup

### 1. Create Upload Preset

1. Go to your [Cloudinary Dashboard](https://cloudinary.com/console)
2. Navigate to **Settings** → **Upload**
3. Scroll down to **Upload presets**
4. Click **Add upload preset**

### 2. Configure Upload Preset

**Basic Settings:**
- **Preset name**: `assignments_unsigned`
- **Signing Mode**: `Unsigned` ⚠️ **Important**
- **Folder**: `assignments`
- **Use filename**: `No`
- **Unique filename**: `No`

**Upload Parameters:**
- **Resource type**: `Raw` (for PDF files)
- **Access control**: `Public read`
- **File size limit**: `100000000` (100MB in bytes)

**Transformation:**
- Leave empty (no transformations needed for PDFs)

### 3. Save Preset

Click **Save** to create the preset.

## 🔒 Security Considerations

### Why Unsigned Upload is Safe

1. **Folder Restriction**: Files can only be uploaded to `assignments/` folder
2. **File Type Validation**: Frontend validates PDF files only
3. **Size Limits**: Cloudinary enforces the 100MB limit
4. **No API Secrets Exposed**: Only the cloud name and preset name are public

### Additional Security (Optional)

For enhanced security, you can:

1. **Enable Eager Transformations**: Process uploads immediately
2. **Set Auto-tagging**: Add automatic tags for organization
3. **Configure Notifications**: Get alerts for uploads
4. **Add Upload Validation**: Server-side validation of Cloudinary URLs

## 🧪 Testing the Setup

1. **Check Environment Variables**: Look for console warnings about missing variables
2. **Test File Upload**: Try uploading a small PDF file
3. **Monitor Progress**: Verify the progress bar works
4. **Check Cloudinary**: Confirm files appear in your Media Library under `assignments/`

## 🐛 Troubleshooting

### Common Issues

**❌ "Cloudinary not configured" Error**
- **Solution**: Set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` in your environment

**❌ "Invalid upload preset" Error**
- **Solution**: Create the unsigned upload preset in Cloudinary dashboard
- **Check**: Preset name matches `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

**❌ Upload fails with 400 error**
- **Solution**: Verify the upload preset is set to `Unsigned`
- **Check**: Folder permissions in Cloudinary

**❌ Files not appearing in Media Library**
- **Check**: Cloudinary dashboard → Media Library → `assignments` folder
- **Solution**: Files are uploaded as `raw` resources, not images

### Debug Information

The console will show detailed upload information:
```javascript
// Successful upload shows:
{
  secure_url: "https://res.cloudinary.com/...",
  public_id: "assignments/filename_timestamp",
  bytes: 1234567,
  format: "pdf"
}
```

## 📋 Migration Notes

### What Changed

1. **File Size Limit**: Increased from 9MB → 100MB
2. **Upload Flow**: Frontend → Cloudinary → Database (vs Frontend → Server → Cloudinary → Database)
3. **Progress Tracking**: Added real-time upload progress
4. **Error Handling**: Improved with specific error messages

### API Routes

- **New**: `/api/assignments/submit-direct` - Database-only submission
- **Old**: `/api/assignments/submit` - Still available as fallback

### UI Updates

- Progress bar during upload
- Better error messages
- File size limit updated to "up to 100MB"
- Enhanced upload feedback

---

🎉 **Your file upload system is now ready for large files with no server limits!**