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

  // Inject a client-side shim that keeps navigation inside the proxied session.
  // Handles the tricky cases that plain attribute rewriting cannot:
  //  - GET form submits (browsers discard the query string baked into `action`,
  //    which is why search boxes like Google returned "Thiếu tham số").
  //  - Programmatic navigation via window.location / assign / replace / open.
  //  - fetch()/XMLHttpRequest calls to same/relative URLs.
  const inject = `<script>(function(){
try{
var DID=${deviceId};
var PBASE="/api/proxy?d="+DID+"&u=";
var PAGE=${JSON.stringify(baseUrl)};
function px(u){try{return PBASE+encodeURIComponent(new URL(u,PAGE).toString());}catch(e){return u;}}
function origOf(u){try{var x=new URL(u,location.href);if(x.pathname==="/api/proxy"){var uu=x.searchParams.get("u");if(uu)return uu;}return x.toString();}catch(e){return u;}}
// GET form submit: rebuild target = action(no query) + serialized fields.
document.addEventListener("submit",function(e){
try{
var f=e.target;if(!f||f.tagName!=="FORM")return;
var m=(f.getAttribute("method")||f.method||"GET").toUpperCase();
if(m!=="GET")return;
e.preventDefault();
var act=origOf(f.action||PAGE);
var base=act.split("#")[0].split("?")[0];
var params=new URLSearchParams();
var els=f.elements;
for(var i=0;i<els.length;i++){var el=els[i];if(!el.name||el.disabled)continue;var t=el.type;if((t==="checkbox"||t==="radio")&&!el.checked)continue;if(t==="submit"||t==="button"||t==="file"||t==="image")continue;params.append(el.name,el.value);}
var qs=params.toString();
window.location.href=PBASE+encodeURIComponent(base+(qs?("?"+qs):""));
}catch(_){}
},true);
// Open target=_blank links in the same frame so they stay proxied.
document.addEventListener("click",function(e){try{var a=e.target&&e.target.closest&&e.target.closest("a");if(a&&a.target){a.removeAttribute("target");}}catch(_){}} ,true);
// Wrap fetch to route relative/same-origin requests through the proxy.
try{
var _f=window.fetch;
window.fetch=function(input,init){
try{
var u=(typeof input==="string")?input:(input&&input.url);
if(u&&!/^\\/api\\/proxy/.test(u)&&!/^(data:|blob:)/i.test(u)){
var abs=new URL(u,PAGE).toString();var pu=px(abs);
if(typeof input==="string")input=pu;else input=new Request(pu,input);
}
}catch(_){}
return _f.call(this,input,init);
};
}catch(_){}
}catch(_){}
})();</script>`
  if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, inject + "</head>")
  else if (/<body[^>]*>/i.test(out)) out = out.replace(/(<body[^>]*>)/i, "$1" + inject)
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
