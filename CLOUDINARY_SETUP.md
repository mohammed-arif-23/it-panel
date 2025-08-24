# Cloudinary Storage Setup

This application uses Cloudinary for file uploads and Supabase for database operations. Cloudinary offers **25GB free storage + 25GB bandwidth per month** without requiring a credit card.

## Required Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Cloudinary Configuration (No Credit Card Required!)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Existing Supabase Configuration (keep these for database operations)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Cloudinary Account Setup (Free - No Credit Card Required)

1. **Create Free Account**:
   - Go to [Cloudinary](https://cloudinary.com/users/register/free)
   - Sign up with email (no credit card required)
   - Verify your email

2. **Get Your Credentials**:
   - After login, go to Dashboard
   - Find your credentials in the "Account Details" section:
     - **Cloud Name**: `Root`
     - **API Key**: `329372434471342`
     - **API Secret**: `afFe6UU9Hx7NkGRLZo_N-oMzr7A`

3. **Set Environment Variables**:
   - Copy `.env.example` to `.env.local`
   - Replace placeholder values with your actual Cloudinary credentials

## Free Tier Benefits

### ✅ Cloudinary Free Tier
- **25GB Storage** (25x more than Supabase)
- **25GB Bandwidth/month** (12.5x more than Supabase)
- **Global CDN** for fast worldwide access
- **Auto-optimization** for web delivery
- **No Credit Card Required**
- **Real-time image transformations**

### 📊 Comparison with Other Services
| Service | Storage | Bandwidth | Credit Card |
|---------|---------|-----------|-------------|
| **Cloudinary** | 25GB | 25GB/month | ❌ No |
| Supabase | 1GB | 2GB/month | ❌ No |
| Firebase | 5GB | 1GB/day | ✅ Required |
| AWS S3 | None | None | ✅ Required |

## File Storage Structure

Files are organized in Cloudinary as:
```
assignments/
  ├── studentId_assignmentId_timestamp
  ├── studentId_assignmentId_timestamp
  └── ...
```

## Features Included

### 🚀 **Automatic Optimizations**
- **Format optimization**: Automatically serves WebP/AVIF when supported
- **Quality optimization**: Smart compression without quality loss
- **Responsive delivery**: Automatic resizing for different devices

### 🔒 **Security Features**
- **Secure URLs**: HTTPS delivery by default
- **Access control**: API key-based authentication
- **Upload restrictions**: Configurable file type and size limits

### 📈 **Monitoring & Analytics**
- **Usage dashboard**: Track storage and bandwidth usage
- **Performance metrics**: Delivery speed and optimization stats
- **Real-time notifications**: Usage alerts and quotas

## Database Integration

- **File uploads** → Cloudinary Storage (25GB free)
- **File URLs** → Stored in Supabase database
- **Metadata & assignments** → Supabase database (unchanged)
- **Downloads** → Direct from Cloudinary URLs (global CDN)

## Advanced Features (Available in Free Tier)

### Image Transformations
```javascript
// Automatic format optimization
https://res.cloudinary.com/your-cloud/image/upload/f_auto/assignments/file.pdf

// Quality optimization
https://res.cloudinary.com/your-cloud/image/upload/q_auto/assignments/file.pdf
```

### Upload Widget (Optional Enhancement)
```javascript
// Can be added later for drag-and-drop uploads
cloudinary.openUploadWidget({
  cloudName: 'your-cloud-name',
  uploadPreset: 'your-preset'
}, (error, result) => {
  // Handle upload result
})
```

## Migration Notes

- **Existing files** in Supabase Storage remain accessible
- **New uploads** automatically go to Cloudinary
- **No frontend changes** needed - everything works the same way
- **Better performance** due to global CDN
- **Cost savings** with generous free tier

## Troubleshooting

### Common Issues
1. **Upload fails**: Check API credentials in `.env.local`
2. **Images not loading**: Verify cloud name is correct
3. **Quota exceeded**: Monitor usage in Cloudinary dashboard

### Support Resources
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js SDK Guide](https://cloudinary.com/documentation/node_integration)
- [Upload API Reference](https://cloudinary.com/documentation/image_upload_api_reference)

## Security Best Practices

1. **Environment Variables**: Never expose API secrets in client-side code
2. **Upload Presets**: Use unsigned presets for client uploads (if needed)
3. **File Validation**: Always validate file types and sizes server-side
4. **Access Control**: Use signed URLs for sensitive content (if needed)

## Next Steps

1. Create your free Cloudinary account
2. Add credentials to `.env.local`
3. Test file uploads - they'll automatically use Cloudinary
4. Monitor usage in your Cloudinary dashboard

Your application is now ready to handle file uploads with Cloudinary's robust, free infrastructure!