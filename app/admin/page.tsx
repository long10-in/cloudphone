import Link from "next/link"
import { Smartphone, ArrowRight } from "lucide-react"
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
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <Link
          href="/dashboard"
          className="flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 transition-colors hover:bg-primary/15"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Smartphone className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">Dùng website</p>
              <p className="text-sm text-muted-foreground text-pretty">
                Mở thiết bị cloud phone và trình duyệt bảo mật của bạn để sử dụng thực tế.
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
        </Link>
      </div>
      <AdminPanel users={users} devices={devices} />
    </div>
  )
}
