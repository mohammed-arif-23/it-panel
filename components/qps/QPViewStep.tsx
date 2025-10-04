'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Download, FileText, Calendar, Eye, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { notificationService } from '../../lib/notificationService'

interface SubjectItem {
  code: string
  name: string
  staff?: string | null
  internal?: string | null
}

interface CloudinaryFile {
  public_id: string
  format: string
  url: string
  bytes: number
  created_at: string
  filename: string
  folder: string
  resource_type: string
}

interface QPViewData {
  department: string
  year: string
  semester?: string
  subject: SubjectItem
}

interface QPViewStepProps {
  data: QPViewData
  onBack: () => void
}

export function QPViewStep({ data, onBack }: QPViewStepProps) {
  const [files, setFiles] = useState<CloudinaryFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string>('')

  // Helper: blob to base64 for Capacitor Filesystem
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const fetchFiles = async (subjectCode: string) => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`/api/qps/list?subject=${encodeURIComponent(subjectCode)}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load question papers')
      setFiles(json.files || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (data.subject?.code) {
      fetchFiles(data.subject.code)
    }
  }, [data.subject?.code])

  const handleDownload = async (file: CloudinaryFile) => {
    const fileId = file.public_id
    setDownloadingFiles(prev => new Set([...prev, fileId]))
    
    try {
      const fileName = file.format ? `${file.filename}.${file.format}` : file.filename
      
      if (Capacitor.isNativePlatform()) {
        // Request permissions if needed
        try { await Filesystem.requestPermissions() } catch {}
        
        // Fetch and save to Downloads (ExternalStorage on Android; Documents on iOS)
        const resp = await fetch(file.url)
        const blob = await resp.blob()
        const b64 = await blobToBase64(blob)
        
        // Prefer ExternalStorage for Android so it appears in Downloads app
        await Filesystem.writeFile({
          path: `Download/${fileName}`,
          data: b64,
          directory: Directory.ExternalStorage,
          recursive: true
        }).catch(async () => {
          // Fallback to Documents (iOS / restricted cases)
          await Filesystem.writeFile({
            path: fileName,
            data: b64,
            directory: Directory.Documents,
            recursive: true
          })
        })
        
        const platform = Capacitor.getPlatform()
        const savedPath = platform === 'android' 
          ? `Download/${fileName}` 
          : `Documents/${fileName}`
        setToast(`✅ Saved to ${savedPath}`)
        setTimeout(() => setToast(''), 3000)
        
        // Show download notification
        await notificationService.notifyQPDownloaded(fileName)
        return
      }
      
      // Web fallback: force download via temporary anchor
      const a = document.createElement('a')
      a.href = file.url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      setToast(`📥 Downloading ${fileName}...`)
      setTimeout(() => setToast(''), 2000)
      
      // Show download notification for web
      await notificationService.notifyQPDownloaded(fileName)
      
    } catch (e: any) {
      console.error('Download failed', e)
      setError('Failed to download file')
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        return newSet
      })
    }
  }

  const handleViewOnline = (file: CloudinaryFile) => {
    window.open(file.url, '_blank', 'noopener,noreferrer')
  }

  const prettySize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-[var(--color-text-muted)] hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
            <FileText className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-primary)]">Question Papers</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{data.subject.code} - {data.subject.name}</p>
        </div>
        <div className="w-16"></div>
      </div>

      {/* Selection Summary */}
      <div className="saas-card p-4">
        <h4 className="font-semibold text-[var(--color-primary)] mb-3">Subject Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-[var(--color-accent)] rounded-lg">
            <span className="text-[var(--color-text-muted)] text-xs">Department</span>
            <p className="font-medium text-[var(--color-primary)]">{data.department}</p>
          </div>
          <div className="p-3 bg-[var(--color-accent)] rounded-lg">
            <span className="text-[var(--color-text-muted)] text-xs">Year</span>
            <p className="font-medium text-[var(--color-primary)]">{data.year}</p>
          </div>
          {data.semester && (
            <div className="p-3 bg-[var(--color-accent)] rounded-lg">
              <span className="text-[var(--color-text-muted)] text-xs">Semester</span>
              <p className="font-medium text-[var(--color-primary)]">{data.semester}</p>
            </div>
          )}
          <div className="p-3 bg-[var(--color-accent)] rounded-lg">
            <span className="text-[var(--color-text-muted)] text-xs">Subject</span>
            <p className="font-medium text-[var(--color-primary)]">{data.subject.code}</p>
          </div>
        </div>
     
      </div>

      {/* Question Papers List */}
      <div className="saas-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-[var(--color-primary)] flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Available Question Papers ({files.length})</span>
          </h4>
          <button
            onClick={() => fetchFiles(data.subject.code)}
            disabled={loading}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Toast Message */}
        {toast && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{toast}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg bg-[var(--color-accent)] border border-[var(--color-border-light)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <Skeleton className="w-8 h-8 rounded-lg bg-[var(--color-border-light)]" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-2 bg-[var(--color-border-light)]" />
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-3 w-16 bg-[var(--color-border-light)]" />
                        <Skeleton className="h-3 w-12 bg-[var(--color-border-light)]" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24 rounded bg-[var(--color-border-light)]" />
                </div>
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h5 className="text-lg font-medium text-[var(--color-text-secondary)] mb-2">No Question Papers Found</h5>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              No question papers have been uploaded for this subject yet.
            </p>
            <button
              onClick={() => fetchFiles(data.subject.code)}
              className="saas-button-secondary text-sm px-4 py-2"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map(file => {
              const isDownloading = downloadingFiles.has(file.public_id)
              return (
                <div key={file.public_id} className="p-4 bg-[var(--color-accent)] rounded-xl hover:shadow-md transition-all border border-[var(--color-border-light)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-primary)] mb-1">
                          {file.filename}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-[var(--color-text-muted)]">
                          <span>{prettySize(file.bytes)}</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded uppercase font-medium">
                            {file.format || 'file'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownload(file)}
                      disabled={isDownloading}
                      size="sm"
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Study Tips */}
      <div className="saas-card p-4">
        <h4 className="font-semibold text-[var(--color-primary)] mb-3">📖 Study Tips</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
            <h5 className="font-medium text-yellow-900 mb-2">Exam Preparation</h5>
            <ul className="text-yellow-700 space-y-1">
              <li>• Practice previous year papers regularly</li>
              <li>• Time yourself while solving</li>
              <li>• Identify recurring question patterns</li>
            </ul>
          </div>
          <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <h5 className="font-medium text-green-900 mb-2">Download Tips</h5>
            <ul className="text-green-700 space-y-1">
              <li>• Download for offline study access</li>
              <li>• Organize papers by exam dates</li>
              <li>• Share with study groups responsibly</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Subject Selection
        </Button>
      </div>
    </div>
  )
}
