import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { device, browserSession } from "@/lib/db/schema"
import { getSession } from "@/lib/session"
import {
  type CookieJar,
  DEFAULT_UA,
  cookieHeaderForHost,
  mergeSetCookies,
  rewriteHtml,
  rewriteCss,
  proxify,
  parseProxyPath,
} from "@/lib/proxy"

export const dynamic = "force-dynamic"

async function authorizeDevice(deviceId: number) {
  const session = await getSession()
  if (!session?.user) return { error: "unauthorized" as const }
  const rows = await db.select().from(device).where(eq(device.id, deviceId)).limit(1)
  const d = rows[0]
  if (!d) return { error: "notfound" as const }
  const isOwner = d.userId === session.user.id
  const isAdmin = session.user.role === "admin"
  if (!isOwner && !isAdmin) return { error: "forbidden" as const }
  return { user: session.user, device: d }
}

async function loadJar(deviceId: number, userId: string) {
  const rows = await db
    .select()
    .from(browserSession)
    .where(eq(browserSession.deviceId, deviceId))
    .limit(1)
  if (!rows[0]) {
    await db
      .insert(browserSession)
      .values({ deviceId, userId, cookies: "{}", userAgent: DEFAULT_UA })
      .onConflictDoNothing()
    return { jar: {} as CookieJar, ua: DEFAULT_UA }
  }
  let jar: CookieJar = {}
  try {
    jar = JSON.parse(rows[0].cookies) as CookieJar
  } catch {
    jar = {}
  }
  return { jar, ua: rows[0].userAgent ?? DEFAULT_UA }
}

async function saveJar(deviceId: number, jar: CookieJar) {
  await db
    .update(browserSession)
    .set({ cookies: JSON.stringify(jar), updatedAt: new Date() })
    .where(eq(browserSession.deviceId, deviceId))
}

async function handle(req: NextRequest, method: "GET" | "POST") {
  // Reconstruct the target from the raw pathname so percent-encoding is kept.
  const parsed = parseProxyPath(req.nextUrl.pathname, req.nextUrl.search)
  if (!parsed) {
    return NextResponse.json({ error: "URL không hợp lệ" }, { status: 400 })
  }
  const { deviceId, target } = parsed

  const authz = await authorizeDevice(deviceId)
  if ("error" in authz) {
    const code = authz.error === "unauthorized" ? 401 : authz.error === "notfound" ? 404 : 403
    return NextResponse.json({ error: authz.error }, { status: code })
  }

  let targetUrl: URL
  try {
    targetUrl = new URL(target)
    if (!/^https?:$/.test(targetUrl.protocol)) throw new Error("bad protocol")
  } catch {
    return NextResponse.json({ error: "URL không hợp lệ" }, { status: 400 })
  }

  const { jar, ua } = await loadJar(deviceId, authz.user.id)
  const host = targetUrl.host

  const headers: Record<string, string> = {
    "User-Agent": ua,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
    Referer: targetUrl.origin + "/",
  }
  const cookie = cookieHeaderForHost(jar, host)
  if (cookie) headers["Cookie"] = cookie

  let body: string | undefined
  if (method === "POST") {
    headers["Content-Type"] =
      req.headers.get("content-type") ?? "application/x-www-form-urlencoded"
    body = await req.text()
  }

  let upstream: Response
  try {
    upstream = await fetch(targetUrl.toString(), {
      method,
      headers,
      body,
      redirect: "manual",
      // @ts-expect-error - duplex required by undici for streamed bodies
      duplex: method === "POST" ? "half" : undefined,
    })
  } catch {
    return new NextResponse(
      `<html><body style="font-family:system-ui;background:#0a0f0d;color:#e6f0ec;padding:40px"><h2>Không thể tải trang</h2><p>Máy chủ không truy cập được ${targetUrl.host}. Trang có thể chặn proxy hoặc đang offline.</p></body></html>`,
      { status: 502, headers: { "Content-Type": "text/html; charset=utf-8" } },
    )
  }

  // Persist any cookies the site set, scoped to this device only.
  const setCookies = upstream.headers.getSetCookie?.() ?? []
  if (setCookies.length) {
    await saveJar(deviceId, mergeSetCookies(jar, host, setCookies))
  }

  // Follow redirects through the proxy so the URL bar stays inside the session.
  if (upstream.status >= 300 && upstream.status < 400) {
    const loc = upstream.headers.get("location")
    if (loc) {
      const abs = new URL(loc, targetUrl).toString()
      return NextResponse.redirect(new URL(proxify(deviceId, abs), req.nextUrl.origin))
    }
  }

  const contentType = upstream.headers.get("content-type") ?? ""

  if (contentType.includes("text/html")) {
    const html = await upstream.text()
    const rewritten = rewriteHtml(html, targetUrl.toString(), deviceId)
    return new NextResponse(rewritten, {
      status: upstream.status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  if (contentType.includes("text/css")) {
    const css = await upstream.text()
    const rewritten = rewriteCss(css, targetUrl.toString(), deviceId)
    return new NextResponse(rewritten, {
      status: upstream.status,
      headers: { "Content-Type": "text/css; charset=utf-8" },
    })
  }

  // Pass through everything else (images, fonts, scripts, JSON) as bytes.
  const buf = await upstream.arrayBuffer()
  return new NextResponse(buf, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      "Cache-Control": "no-store",
    },
  })
}

export async function GET(req: NextRequest) {
  return handle(req, "GET")
}

export async function POST(req: NextRequest) {
  return handle(req, "POST")
}
