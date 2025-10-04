import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// GET /api/qps/list?subject=CODE
// Lists Cloudinary resources under folder questionpapers/<subject>
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get('subject')?.trim()

    if (!subject) {
      return NextResponse.json({ success: false, error: 'subject is required' }, { status: 400 })
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Missing Cloudinary configuration')
      return NextResponse.json({ success: false, error: 'Cloudinary not configured' }, { status: 500 })
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    })

    const sanitize = (s: string) => s
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^A-Za-z0-9 _().\-]/g, '')
      .replace(/\s+/g, '_')

    const sanitized = sanitize(subject)
    const folderOriginal = `questionpapers/${subject}`
    const folderSanitized = `questionpapers/${sanitized}`
    const exprOriginal = `folder="${folderOriginal.replace(/"/g, '\\"')}"`
    const exprSanitized = `folder="${folderSanitized.replace(/"/g, '\\"')}"`

    // Try original first, then sanitized
    const res1 = await cloudinary.search.expression(exprOriginal).max_results(100).execute().catch(() => ({ resources: [] }))
    const res2 = await cloudinary.search.expression(exprSanitized).max_results(100).execute().catch(() => ({ resources: [] }))

    const seen = new Set<string>()
    const merged = [...(res1.resources || []), ...(res2.resources || [])].filter((r: any) => {
      if (seen.has(r.public_id)) return false
      seen.add(r.public_id)
      return true
    })

    const files = (merged || []).map((r: any) => ({
      public_id: r.public_id,
      format: r.format,
      url: r.secure_url,
      bytes: r.bytes,
      created_at: r.created_at,
      filename: r.filename || r.public_id.split('/').pop(),
      folder: r.folder,
      resource_type: r.resource_type,
    }))

    return NextResponse.json({ success: true, files })
  } catch (err) {
    console.error('Cloudinary list error', err)
    return NextResponse.json({ success: false, error: 'Failed to list question papers' }, { status: 500 })
  }
}
