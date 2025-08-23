import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Assignment Submission - Department of IT',
  description: 'Submit and track your assignments',
}

export default function AssignmentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}