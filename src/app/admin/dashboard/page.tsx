import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { requireActiveBilling } from '@/lib/auth'
import AdminDashboardContent from './admin-dashboard-content'

async function AdminDashboardPageContent() {
  await requireActiveBilling()

  return <AdminDashboardContent />
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <AdminDashboardPageContent />
    </Suspense>
  )
}
