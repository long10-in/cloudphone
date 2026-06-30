import { requireAdmin } from "@/lib/session"
import { listUsers, listAllDevices } from "@/app/actions/admin"
import { DashboardNav } from "@/components/dashboard-nav"
import { AdminPanel } from "@/components/admin-panel"

export const metadata = {
  title: "Quản trị | NebulaPhone",
}

export default async function AdminPage() {
  const admin = await requireAdmin()
  const [users, devices] = await Promise.all([listUsers(), listAllDevices()])

  return (
    <div className="min-h-svh">
      <DashboardNav name={admin.name} email={admin.email} role="admin" />
      <AdminPanel users={users} devices={devices} />
    </div>
  )
}
