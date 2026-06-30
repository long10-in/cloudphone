"use server"

import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { device, browserSession } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { DEFAULT_UA } from "@/lib/proxy"

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user
}

// Ensure the caller owns the device (or is admin) before touching its session.
async function assertAccess(deviceId: number) {
  const user = await getUser()
  const rows = await db.select().from(device).where(eq(device.id, deviceId)).limit(1)
  const d = rows[0]
  if (!d) throw new Error("Không tìm thấy thiết bị")
  if (d.userId !== user.id && user.role !== "admin") throw new Error("Forbidden")
  return { user, device: d }
}

// Wipe all cookies/session data for a device's secure browser.
export async function resetBrowserData(deviceId: number) {
  const { user } = await assertAccess(deviceId)
  await db
    .insert(browserSession)
    .values({ deviceId, userId: user.id, cookies: "{}", userAgent: DEFAULT_UA })
    .onConflictDoUpdate({
      target: browserSession.deviceId,
      set: { cookies: "{}", updatedAt: new Date() },
    })
  return { ok: true }
}

// Lightweight stats: how many hosts have stored cookies for this device.
export async function getBrowserStats(deviceId: number) {
  await assertAccess(deviceId)
  const rows = await db
    .select()
    .from(browserSession)
    .where(eq(browserSession.deviceId, deviceId))
    .limit(1)
  if (!rows[0]) return { sites: 0 }
  try {
    const jar = JSON.parse(rows[0].cookies) as Record<string, unknown>
    return { sites: Object.keys(jar).length }
  } catch {
    return { sites: 0 }
  }
}
