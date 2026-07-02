import { eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Cpu, MemoryStick, HardDrive, MapPin } from "lucide-react"
import { requireUser } from "@/lib/session"
import { db } from "@/lib/db"
import { device, browserSession, browserProfile } from "@/lib/db/schema"
import { DashboardNav } from "@/components/dashboard-nav"
import { DeviceWorkspace } from "@/components/device-workspace"

// Cloud Browser server actions run within this route's function and drive a
// remote Chromium over CDP, which can take longer than the default limit.
export const maxDuration = 60

export default async function DevicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  const deviceId = Number(id)
  if (!Number.isInteger(deviceId)) notFound()

  const rows = await db.select().from(device).where(eq(device.id, deviceId)).limit(1)
  const d = rows[0]
  if (!d) notFound()

  const isAdmin = user.role === "admin"
  if (d.userId !== user.id && !isAdmin) redirect("/dashboard")

  const sessRows = await db
    .select()
    .from(browserSession)
    .where(eq(browserSession.deviceId, deviceId))
    .limit(1)
  let sites = 0
  if (sessRows[0]) {
    try {
      sites = Object.keys(JSON.parse(sessRows[0].cookies)).length
    } catch {
      sites = 0
    }
  }

  const profileRows = await db
    .select()
    .from(browserProfile)
    .where(eq(browserProfile.deviceId, deviceId))
    .orderBy(browserProfile.createdAt)
  const profiles = profileRows.map((r) => ({
    id: r.id,
    name: r.name,
    siteCount: r.siteCount,
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav name={user.name} email={user.email} role={user.role ?? "user"} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại thiết bị
        </Link>

        <div className="mt-4 flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{d.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{d.androidVersion}</span>
            <span className="inline-flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              {d.cpu} vCPU
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MemoryStick className="h-3.5 w-3.5" />
              {d.ram} GB RAM
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5" />
              {d.storage} GB
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {d.region}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <DeviceWorkspace
            deviceId={d.id}
            deviceName={d.name}
            androidVersion={d.androidVersion}
            initialSites={sites}
            initialProfiles={profiles}
          />
        </div>
      </main>
    </div>
  )
}
