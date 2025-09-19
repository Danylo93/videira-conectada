import DashboardContent from './dashboard-content'

export default function DashboardPage() {
  // Mock tenant data for development
  const tenant = {
    id: 'mock-tenant-id',
    slug: 'local-test',
    name: 'Igreja Local Test',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return <DashboardContent tenant={tenant} />
}
