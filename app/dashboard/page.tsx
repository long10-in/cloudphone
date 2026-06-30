import { requireUser } from "@/lib/session"
import { getMyDevices } from "@/app/actions/devices"
import { DashboardNav } from "@/components/dashboard-nav"
import { DeviceCard } from "@/components/device-card"
import { Smartphone, Cpu, Activity } from "lucide-react"

export const metadata = {
  title: "Bảng điều khiển | NebulaPhone",
}

export default async function DashboardPage() {
  const user = await requireUser()
  const devices = await getMyDevices()

  const running = devices.filter((d) => d.status === "running").length
  const totalCpu = devices.reduce((sum, d) => sum + d.cpu, 0)

  const stats = [
    { label: "Tổng thiết bị", value: devices.length, icon: Smartphone },
    { label: "Đang hoạt động", value: running, icon: Activity },
    { label: "Tổng vCPU", value: totalCpu, icon: Cpu },
  ]

  return (
    <div className="min-h-svh">
      <DashboardNav name={user.name} email={user.email} role={user.role ?? "user"} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Xin chào, {user.name}</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các điện thoại đám mây của bạn tại đây.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold leading-tight">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mt-10 mb-4 text-lg font-semibold">Thiết bị của tôi</h2>

        {devices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
            <Smartphone className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">Chưa có thiết bị nào</p>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              Quản trị viên chưa cấp điện thoại đám mây cho tài khoản này. Vui lòng liên hệ để được hỗ trợ.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((d) => (
              <DeviceCard key={d.id} device={d} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
