// Server-side secure browser proxy helpers.
// Each virtual device has an isolated cookie jar so sessions never mix,
// and all traffic is fetched server-side so the target site sees the
// server's IP and a consistent generic fingerprint — not the real device.

export type CookieJar = Record<string, Record<string, string>>

// A common, stable desktop Chrome UA used for every proxied request so the
// real device/browser is never exposed to target sites.
export const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

export function proxify(deviceId: number, absoluteUrl: string): string {
  return `/api/proxy?d=${deviceId}&u=${encodeURIComponent(absoluteUrl)}`
}

function resolve(base: string, ref: string): string | null {
  try {
    return new URL(ref, base).toString()
  } catch {
    return null
  }
}

function skip(ref: string): boolean {
  const r = ref.trim().toLowerCase()
  return (
    r === "" ||
    r.startsWith("#") ||
    r.startsWith("data:") ||
    r.startsWith("blob:") ||
    r.startsWith("javascript:") ||
    r.startsWith("mailto:") ||
    r.startsWith("tel:") ||
    r.startsWith("about:")
  )
}

// Build the Cookie header string for a given host from the jar.
export function cookieHeaderForHost(jar: CookieJar, host: string): string {
  const bag = jar[host] ?? {}
  return Object.entries(bag)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ")
}

// Merge Set-Cookie response headers into the jar for a host.
export function mergeSetCookies(jar: CookieJar, host: string, setCookies: string[]): CookieJar {
  if (!setCookies.length) return jar
  const bag = { ...(jar[host] ?? {}) }
  for (const sc of setCookies) {
    const first = sc.split(";")[0]
    const eq = first.indexOf("=")
    if (eq <= 0) continue
    const name = first.slice(0, eq).trim()
    const value = first.slice(eq + 1).trim()
    if (name) bag[name] = value
  }
  return { ...jar, [host]: bag }
}

// Rewrite an HTML document so every navigable URL and resource routes back
// through the proxy, keeping the user inside the isolated session.
export function rewriteHtml(html: string, baseUrl: string, deviceId: number): string {
  let out = html

  // Remove CSP and SRI that would block proxied/rewritten resources.
  out = out.replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi, "")
  out = out.replace(/\sintegrity=("|')[^"']*\1/gi, "")
  out = out.replace(/\scrossorigin(=("|')[^"']*\2)?/gi, "")

  // Rewrite standard URL-bearing attributes.
  out = out.replace(
    /\b(href|src|action|poster|formaction|data-src)\s*=\s*("|')(.*?)\2/gi,
    (m, attr, q, val) => {
      if (skip(val)) return m
      const abs = resolve(baseUrl, val)
      if (!abs) return m
      return `${attr}=${q}${proxify(deviceId, abs)}${q}`
    },
  )

  // Rewrite srcset (comma-separated list of "url descriptor").
  out = out.replace(/\bsrcset\s*=\s*("|')(.*?)\1/gi, (m, q, val) => {
    const parts = val
      .split(",")
      .map((piece: string) => {
        const seg = piece.trim()
        if (!seg) return ""
        const sp = seg.split(/\s+/)
        const u = sp[0]
        if (skip(u)) return seg
        const abs = resolve(baseUrl, u)
        if (!abs) return seg
        return [proxify(deviceId, abs), ...sp.slice(1)].join(" ")
      })
      .filter(Boolean)
      .join(", ")
    return `srcset=${q}${parts}${q}`
  })

  // Rewrite url(...) inside inline styles / <style> blocks.
  out = out.replace(/url\(\s*("|')?([^"')]+)\1?\s*\)/gi, (m, q, val) => {
    if (skip(val)) return m
    const abs = resolve(baseUrl, val)
    if (!abs) return m
    return `url(${q ?? ""}${proxify(deviceId, abs)}${q ?? ""})`
  })

  // Inject a small banner-safe base note + open external target links in-frame.
  const inject = `<script>(function(){try{document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a');if(a&&a.target){a.removeAttribute('target');}},true);}catch(_){}})();</script>`
  if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, inject + "</head>")
  else out = inject + out

  return out
}

// Rewrite url(...) references inside a standalone CSS file.
export function rewriteCss(css: string, baseUrl: string, deviceId: number): string {
  return css.replace(/url\(\s*("|')?([^"')]+)\1?\s*\)/gi, (m, q, val) => {
    if (skip(val)) return m
    const abs = resolve(baseUrl, val)
    if (!abs) return m
    return `url(${q ?? ""}${proxify(deviceId, abs)}${q ?? ""})`
  })
}
