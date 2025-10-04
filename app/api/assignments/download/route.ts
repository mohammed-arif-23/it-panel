import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get('url')
    const fileName = searchParams.get('filename')

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 })
    }

    // SECURITY: Whitelist allowed domains to prevent SSRF attacks
    const allowedDomains = [
      'res.cloudinary.com',
      'cloudinary.com',
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('http://', '')
    ].filter(Boolean)

    let parsedUrl: URL
    try {
      parsedUrl = new URL(fileUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Check if hostname is in whitelist
    const isAllowed = allowedDomains.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    )

    if (!isAllowed) {
      console.warn(`Blocked download attempt from unauthorized domain: ${parsedUrl.hostname}`)
      return NextResponse.json({ error: 'Unauthorized file source' }, { status: 403 })
    }

    // Prevent access to private/internal networks
    const hostname = parsedUrl.hostname
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('169.254.')
    ) {
      return NextResponse.json({ error: 'Access to internal networks is forbidden' }, { status: 403 })
    }

    // Fetch the file from the external URL (Cloudinary/Supabase)
    const response = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'IT-Panel-Download-Proxy/1.0'
      },
      signal: AbortSignal.timeout(30000) // 30s timeout
    })
    
    if (!response.ok) {
      return NextResponse.json({ error: 'File not found or not accessible' }, { status: 404 })
    }

    // Get the file content
    const fileBuffer = await response.arrayBuffer()
    
    // Determine content type
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    // Create response with proper headers for file download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName || 'download'}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Download proxy error:', error)
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
  }
}