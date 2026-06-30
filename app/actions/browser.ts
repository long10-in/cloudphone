"use server"

import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { device, browserSession, browserProfile } from "@/lib/db/schema"
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

function countSites(cookies: string): number {
  try {
    return Object.keys(JSON.parse(cookies)).length
  } catch {
    return 0
  }
}

export type BrowserProfileInfo = {
  id: number
  name: string
  siteCount: number
  createdAt: string
}

// List all saved profiles for a device.
export async function listProfiles(deviceId: number): Promise<BrowserProfileInfo[]> {
  await assertAccess(deviceId)
  const rows = await db
    .select()
    .from(browserProfile)
    .where(eq(browserProfile.deviceId, deviceId))
    .orderBy(browserProfile.createdAt)
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    siteCount: r.siteCount,
    createdAt: r.createdAt.toISOString(),
  }))
}

// Snapshot the current live session into a new named profile.
export async function saveProfile(deviceId: number, name: string) {
  const { user } = await assertAccess(deviceId)
  const trimmed = name.trim()
  if (!trimmed) throw new Error("Tên hồ sơ không được để trống")

  const sessRows = await db
    .select()
    .from(browserSession)
    .where(eq(browserSession.deviceId, deviceId))
    .limit(1)
  const cookies = sessRows[0]?.cookies ?? "{}"

  await db.insert(browserProfile).values({
    deviceId,
    userId: user.id,
    name: trimmed,
    cookies,
    siteCount: countSites(cookies),
  })
  return { ok: true }
}

// Load a saved profile into the live session (replaces current data).
export async function loadProfile(profileId: number) {
  const user = await getUser()
  const rows = await db
    .select()
    .from(browserProfile)
    .where(eq(browserProfile.id, profileId))
    .limit(1)
  const p = rows[0]
  if (!p) throw new Error("Không tìm thấy hồ sơ")
  if (p.userId !== user.id && user.role !== "admin") throw new Error("Forbidden")

  await db
    .insert(browserSession)
    .values({ deviceId: p.deviceId, userId: p.userId, cookies: p.cookies, userAgent: DEFAULT_UA })
    .onConflictDoUpdate({
      target: browserSession.deviceId,
      set: { cookies: p.cookies, updatedAt: new Date() },
    })
  return { ok: true, sites: p.siteCount }
}

// Delete a saved profile.
export async function deleteProfile(profileId: number) {
  const user = await getUser()
  const rows = await db
    .select()
    .from(browserProfile)
    .where(eq(browserProfile.id, profileId))
    .limit(1)
  const p = rows[0]
  if (!p) return { ok: true }
  if (p.userId !== user.id && user.role !== "admin") throw new Error("Forbidden")
  await db.delete(browserProfile).where(eq(browserProfile.id, profileId))
  return { ok: true }
}
