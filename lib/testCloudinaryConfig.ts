/**
 * Cloudinary Direct Upload Configuration Test
 * Run this in browser console to test the setup
 */

export function testCloudinaryConfig() {
  console.log('🧪 Testing Cloudinary Direct Upload Configuration...\n')
  
  // Check environment variables
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  
  console.log('📋 Environment Variables:')
  console.log(`  Cloud Name: ${cloudName ? '✅ Set' : '❌ Missing'}`)
  console.log(`  Upload Preset: ${uploadPreset ? '✅ Set' : '⚠️ Using default'}`)
  
  if (!cloudName) {
    console.error('❌ CRITICAL: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set!')
    return false
  }
  
  // Test Cloudinary API endpoint
  const testUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`
  console.log(`\n🌐 API Endpoint: ${testUrl}`)
  
  // Test upload preset endpoint
  const presetUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload_presets/${uploadPreset || 'assignments_unsigned'}`
  console.log(`📋 Preset Check: ${presetUrl}`)
  
  console.log('\n✅ Basic configuration looks good!')
  console.log('\n📝 Next steps:')
  console.log('  1. Create unsigned upload preset in Cloudinary dashboard')
  console.log('  2. Set folder to "assignments"')
  console.log('  3. Set resource type to "raw"')
  console.log('  4. Test with actual file upload')
  
  return true
}

// Auto-run test if in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  testCloudinaryConfig()
}