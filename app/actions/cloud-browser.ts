"use server"

import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { device, cloudBrowser } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import {
  isBrowserbaseEnabled,
  createContext,
  deleteContext,
  createSession,
  isSessionAlive,
  getLiveViewUrl,
  navigateSession,
  endSession,
  bb,
} from "@/lib/browserbase"

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user
}

// Verify the caller owns the device (or is admin) and return the connect URL.
async function assertAccess(deviceId: number) {
  const user = await getUser()
  const rows = await db.select().from(device).where(eq(device.id, deviceId)).limit(1)
  const d = rows[0]
  if (!d) throw new Error("Không tìm thấy thiết bị")
  if (d.userId !== user.id && user.role !== "admin") throw new Error("Forbidden")
  return { user, device: d }
}

async function getRow(deviceId: number) {
  const rows = await db
    .select()
    .from(cloudBrowser)
    .where(eq(cloudBrowser.deviceId, deviceId))
    .limit(1)
  return rows[0] ?? null
}

export type CloudStatus = {
  enabled: boolean
  running: boolean
  liveViewUrl: string | null
  // Real failure reason, returned as data. Errors THROWN from server actions
  // are masked by Next.js in production ("An error occurred in the Server
  // Components render..."), so we must return them instead of throwing.
  error?: string | null
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  return typeof e === "string" ? e : "Lỗi không xác định"
}

export async function getCloudStatus(deviceId: number): Promise<CloudStatus> {
  try {
    await assertAccess(deviceId)
    if (!isBrowserbaseEnabled()) {
      return { enabled: false, running: false, liveViewUrl: null }
    }
    const row = await getRow(deviceId)
    if (row?.sessionId && (await isSessionAlive(row.sessionId))) {
      const liveViewUrl = await getLiveViewUrl(row.sessionId)
      return { enabled: true, running: true, liveViewUrl }
    }
    return { enabled: true, running: false, liveViewUrl: null }
  } catch (e) {
    return { enabled: true, running: false, liveViewUrl: null, error: errMsg(e) }
  }
}

// Start (or resume) a real cloud Chromium for this device.
export async function startCloudBrowser(deviceId: number): Promise<CloudStatus> {
  try {
    const { user } = await assertAccess(deviceId)
    if (!isBrowserbaseEnabled()) {
      return { enabled: false, running: false, liveViewUrl: null }
    }

    const row = await getRow(deviceId)

    // Reuse a live session if one is still running.
    if (row?.sessionId && (await isSessionAlive(row.sessionId))) {
      const liveViewUrl = await getLiveViewUrl(row.sessionId)
      return { enabled: true, running: true, liveViewUrl }
    }

    // Ensure the device has its own persistent context (isolated identity).
    // If a stale context id can't be reused, fall back to a fresh one.
    let contextId = row?.contextId ?? null
    if (!contextId) {
      contextId = await createContext()
    }

    let session
    try {
      session = await createSession(contextId)
    } catch {
      // The stored context may be invalid/expired — retry once with a new one.
      contextId = await createContext()
      session = await createSession(contextId)
    }

    if (row) {
      await db
        .update(cloudBrowser)
        .set({ contextId, sessionId: session.sessionId, updatedAt: new Date() })
        .where(eq(cloudBrowser.deviceId, deviceId))
    } else {
      await db.insert(cloudBrowser).values({
        deviceId,
        userId: user.id,
        contextId,
        sessionId: session.sessionId,
      })
    }

    // IMPORTANT: do NOT drive playwright here. On serverless, a stalled CDP
    // connection can hang until the platform kills the function, producing an
    // uncatchable "Server Components render" error. We return the live view
    // immediately; the user lands on a page via the address bar / quick links.
    return { enabled: true, running: true, liveViewUrl: session.liveViewUrl }
  } catch (e) {
    return { enabled: true, running: false, liveViewUrl: null, error: errMsg(e) }
  }
}

async function connectUrlFor(sessionId: string): Promise<string> {
  const s = await bb().sessions.retrieve(sessionId)
  if (!s.connectUrl) throw new Error("Không lấy được kết nối phiên")
  return s.connectUrl
}

export async function navigateCloud(
  deviceId: number,
  rawUrl: string,
): Promise<{ url: string; title: string; error?: string | null }> {
  try {
    await assertAccess(deviceId)
    const row = await getRow(deviceId)
    if (!row?.sessionId || !(await isSessionAlive(row.sessionId))) {
      return { url: "", title: "", error: "Phiên trình duyệt chưa khởi động" }
    }

    let target = rawUrl.trim()
    if (!target) return { url: "", title: "", error: "Vui lòng nhập địa chỉ" }
    // If it looks like a URL, normalize; otherwise treat as a Google search.
    const looksLikeUrl = /^https?:\/\//i.test(target) || /^[\w-]+(\.[\w-]+)+/.test(target)
    if (looksLikeUrl) {
      if (!/^https?:\/\//i.test(target)) target = "https://" + target
    } else {
      target = "https://www.google.com/search?q=" + encodeURIComponent(target)
    }

    const connectUrl = await connectUrlFor(row.sessionId)
    return await navigateSession(connectUrl, target)
  } catch (e) {
    return { url: "", title: "", error: errMsg(e) }
  }
}

// Stop the session (keeps the context so logins persist next time).
export async function stopCloudBrowser(deviceId: number): Promise<CloudStatus> {
  try {
    await assertAccess(deviceId)
    const row = await getRow(deviceId)
    if (row?.sessionId) {
      await endSession(row.sessionId)
      await db
        .update(cloudBrowser)
        .set({ sessionId: null, updatedAt: new Date() })
        .where(eq(cloudBrowser.deviceId, deviceId))
    }
    return { enabled: isBrowserbaseEnabled(), running: false, liveViewUrl: null }
  } catch (e) {
    return { enabled: true, running: false, liveViewUrl: null, error: errMsg(e) }
  }
}

// Wipe all stored data: end session AND delete the persistent context.
export async function resetCloudBrowser(deviceId: number): Promise<CloudStatus> {
  try {
    const { user } = await assertAccess(deviceId)
    const row = await getRow(deviceId)
    if (row?.sessionId) {
      await endSession(row.sessionId)
    }
    if (row?.contextId) {
      await deleteContext(row.contextId)
    }
    // Fresh context for a clean identity next start.
    const contextId = isBrowserbaseEnabled() ? await createContext() : null
    if (row) {
      await db
        .update(cloudBrowser)
        .set({ contextId, sessionId: null, updatedAt: new Date() })
        .where(eq(cloudBrowser.deviceId, deviceId))
    } else {
      await db.insert(cloudBrowser).values({ deviceId, userId: user.id, contextId })
    }
    return { enabled: isBrowserbaseEnabled(), running: false, liveViewUrl: null }
  } catch (e) {
    return { enabled: true, running: false, liveViewUrl: null, error: errMsg(e) }
  }
}
