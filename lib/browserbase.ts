import Browserbase from "@browserbasehq/sdk"

// NOTE: playwright-core is intentionally NOT imported at the top level.
// It is a heavy package with dynamic requires that can fail to load in the
// serverless actions bundle. Importing it here would break EVERY function in
// this module (status/start/stop/reset) — even the ones that never touch a
// browser — because the whole module fails to initialize. We therefore load
// it lazily, only inside the two functions that actually drive Chromium.
async function getChromium() {
  const { chromium } = await import("playwright-core")
  return chromium
}

// IMPORTANT: read process.env at call time (not as a module-level const).
// A top-level const can be evaluated during the build/bundle step and frozen
// to `false`, which made Cloud Browser show "chưa sẵn sàng" in production even
// though the env vars were set. A function guarantees a runtime lookup.
export function isBrowserbaseEnabled(): boolean {
  return !!process.env.BROWSERBASE_API_KEY && !!process.env.BROWSERBASE_PROJECT_ID
}

let _client: Browserbase | null = null

export function bb(): Browserbase {
  if (!process.env.BROWSERBASE_API_KEY) {
    throw new Error("BROWSERBASE_API_KEY chưa được cấu hình")
  }
  if (!_client) {
    _client = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY })
  }
  return _client
}

export function projectId(): string {
  const id = process.env.BROWSERBASE_PROJECT_ID
  if (!id) throw new Error("BROWSERBASE_PROJECT_ID chưa được cấu hình")
  return id
}

// Create a persistent Context so cookies/logins survive across sessions.
// Each device gets its own context => fully isolated identity.
export async function createContext(): Promise<string> {
  const ctx = await bb().contexts.create({ projectId: projectId() })
  return ctx.id
}

export async function deleteContext(contextId: string): Promise<void> {
  try {
    await bb().contexts.delete(contextId)
  } catch {
    // already gone / expired — ignore
  }
}

export type LiveSession = {
  sessionId: string
  connectUrl: string
  liveViewUrl: string
}

// Spin up a real Chromium session bound to the device's persistent context.
// NOTE: no `keepAlive` — that flag is a paid-plan feature on Browserbase and
// makes session creation fail with an API error on the free plan.
export async function createSession(contextId: string): Promise<LiveSession> {
  const session = await bb().sessions.create({
    projectId: projectId(),
    // Pin the browser to the region closest to our users (Singapore) to cut
    // down the CDP stream round-trip latency that makes the live view feel laggy.
    region: "ap-southeast-1",
    browserSettings: {
      context: { id: contextId, persist: true },
      blockAds: true,
      viewport: { width: 390, height: 844 },
    },
  })

  const links = await bb().sessions.debug(session.id)
  return {
    sessionId: session.id,
    connectUrl: session.connectUrl,
    liveViewUrl: links.debuggerFullscreenUrl,
  }
}

// Is a session still running?
export async function isSessionAlive(sessionId: string): Promise<boolean> {
  try {
    const s = await bb().sessions.retrieve(sessionId)
    return s.status === "RUNNING"
  } catch {
    return false
  }
}

// Get the interactive live-view URL for an existing session.
export async function getLiveViewUrl(sessionId: string): Promise<string> {
  const links = await bb().sessions.debug(sessionId)
  return links.debuggerFullscreenUrl
}

// Drive the live session to a URL over CDP (Playwright).
// The live-view iframe reflects the change instantly for the user.
export async function navigateSession(
  connectUrl: string,
  url: string,
): Promise<{ url: string; title: string }> {
  // A connect timeout is CRITICAL on serverless: without it, a stalled CDP
  // WebSocket hangs until the platform kills the whole function (surfacing as
  // a generic "Server Components render" error that no try/catch can trap).
  const chromium = await getChromium()
  const browser = await chromium.connectOverCDP(connectUrl, { timeout: 20000 })
  try {
    const context = browser.contexts()[0]
    const page = context?.pages()[0] ?? (await context.newPage())
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 })
    let title = ""
    try {
      title = await page.title()
    } catch {
      title = ""
    }
    return { url: page.url(), title }
  } finally {
    // Detach without closing the remote browser so the session keeps running.
    await browser.close()
  }
}

// Type text (and optionally press Enter) into whatever element is currently
// focused inside the live session. Browserbase's live view has no mobile
// keyboard, so this lets users input text via a field in our own toolbar.
export async function typeSession(
  connectUrl: string,
  text: string,
  pressEnter: boolean,
): Promise<{ url: string; title: string }> {
  const chromium = await getChromium()
  const browser = await chromium.connectOverCDP(connectUrl, { timeout: 20000 })
  try {
    const context = browser.contexts()[0]
    const page = context?.pages()[0]
    if (!page) return { url: "", title: "" }
    if (text) {
      await page.keyboard.type(text, { delay: 15 })
    }
    if (pressEnter) {
      await page.keyboard.press("Enter")
      // Give the resulting navigation/search a moment to settle.
      await page.waitForTimeout(800)
    }
    return { url: page.url(), title: await page.title().catch(() => "") }
  } finally {
    await browser.close()
  }
}

// Read the current page URL/title from a running session.
export async function readSessionPage(
  connectUrl: string,
): Promise<{ url: string; title: string }> {
  const chromium = await getChromium()
  const browser = await chromium.connectOverCDP(connectUrl, { timeout: 20000 })
  try {
    const context = browser.contexts()[0]
    const page = context?.pages()[0]
    if (!page) return { url: "", title: "" }
    return { url: page.url(), title: await page.title().catch(() => "") }
  } finally {
    await browser.close()
  }
}

// Gracefully end a session (context persists for next time).
export async function endSession(sessionId: string): Promise<void> {
  try {
    await bb().sessions.update(sessionId, {
      projectId: projectId(),
      status: "REQUEST_RELEASE",
    })
  } catch {
    // ignore
  }
}
