'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, FileText, Download, Loader2, RefreshCw } from 'lucide-react'
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

interface LabManualsViewData {
  department: string
  year: string
  semester?: string
  subject: SubjectItem
}

interface LabManualsViewStepProps {
  data: LabManualsViewData
  onBack: () => void
}

export function LabManualsViewStep({ data, onBack }: LabManualsViewStepProps) {
  const [files, setFiles] = useState<CloudinaryFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string>('')

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:mime;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const prettySize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDownload = async (file: CloudinaryFile) => {
    const fileId = file.public_id
    setDownloadingFiles(prev => new Set([...prev, fileId]))
    
    try {
      const fileName = file.format ? `${file.filename}.${file.format}` : file.filename
      
      if (Capacitor.isNativePlatform()) {
        try { await Filesystem.requestPermissions() } catch {}
        
        const resp = await fetch(file.url)
        const blob = await resp.blob()
        const b64 = await blobToBase64(blob)
        
        await Filesystem.writeFile({
          path: `Download/${fileName}`,
          data: b64,
          directory: Directory.ExternalStorage,
          recursive: true
        }).catch(async () => {
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
        await notificationService.notifyLabManualDownloaded(fileName)
        return
      }
      
      const a = document.createElement('a')
      a.href = file.url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      setToast(`📥 Downloading ${fileName}...`)
      setTimeout(() => setToast(''), 2000)
      
      // Show download notification for web
      await notificationService.notifyLabManualDownloaded(fileName)
      
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

  const fetchFiles = async (subjectCode: string) => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`/api/lab-manuals/list?subject=${encodeURIComponent(subjectCode)}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load lab manuals')
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

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Selection</span>
        </button>
        <div className="text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
            <FileText className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-primary)]">Lab Manuals</h3>
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

      {/* Lab Manuals List */}
      <div className="saas-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-[var(--color-primary)]">Available Lab Manuals</h4>
          <button
            onClick={() => fetchFiles(data.subject.code)}
            disabled={loading}
            className="flex items-center space-x-2 text-sm text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

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
            <h5 className="text-lg font-medium text-[var(--color-text-secondary)] mb-2">No Lab Manuals Found</h5>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              No lab manuals have been uploaded for this subject yet.
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
                      <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-semibold text-[var(--color-primary)] mb-1 truncate">
                          {file.filename}
                        </h5>
                        <div className="flex items-center space-x-3 text-xs text-[var(--color-text-muted)]">
                          <span>{prettySize(file.bytes)}</span>
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded uppercase font-medium">
                            {file.format || 'file'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownload(file)}
                      disabled={isDownloading}
                      size="sm"
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow"
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
    </div>
  )
}
