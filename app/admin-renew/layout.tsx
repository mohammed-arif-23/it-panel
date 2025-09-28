import type { Metadata } from 'next'
import AdminAuthGuard from '@/components/admin/AdminAuthGuard'
import AdminSubHeader from '@/components/admin/AdminSubHeader'

export const metadata: Metadata = {
  title: 'Admin Panel - College Management System',
  description: 'Administrative panel for renewed UI and tools',
}

export default function AdminRenewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthGuard>
      <AdminSubHeader basePath="/admin-renew" />
      {children}
    </AdminAuthGuard>
  )
}
