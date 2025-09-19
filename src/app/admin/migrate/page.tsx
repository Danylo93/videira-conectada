import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { requireActiveBilling } from '@/lib/auth'
import MigrateContent from './migrate-content'

async function MigratePageContent() {
  await requireActiveBilling()

  return <MigrateContent />
}

export default function MigratePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <MigratePageContent />
    </Suspense>
  )
}
