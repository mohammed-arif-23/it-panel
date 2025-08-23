import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Panel - College Management System',
  description: 'Administrative panel for database management and export',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}