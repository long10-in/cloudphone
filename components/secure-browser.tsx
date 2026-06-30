"use client"

import { useRef, useState, useTransition, useCallback } from "react"
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Shield,
  Trash2,
  Loader2,
  Lock,
  Search,
} from "lucide-react"
import { resetBrowserData } from "@/app/actions/browser"

const SHORTCUTS = [
  { label: "Google", url: "https://www.google.com" },
  { label: "Bing", url: "https://www.bing.com" },
  { label: "DuckDuckGo", url: "https://duckduckgo.com" },
  { label: "Wikipedia", url: "https://vi.wikipedia.org" },
  { label: "Example", url: "https://example.com" },
]

function proxify(deviceId: number, url: string) {
  return `/api/proxy?d=${deviceId}&u=${encodeURIComponent(url)}`
}

function normalizeInput(raw: string): string {
  const v = raw.trim()
  if (!v) return ""
  // Looks like a domain → prepend https. Otherwise treat as a search query.
  if (/^https?:\/\//i.test(v)) return v
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v)) return "https://" + v
  return "https://duckduckgo.com/?q=" + encodeURIComponent(v)
}

export function SecureBrowser({
  deviceId,
  deviceName,
  initialSites,
}: {
  deviceId: number
  deviceName: string
  initialSites: number
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [address, setAddress] = useState("")
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sites, setSites] = useState(initialSites)
  const [isResetting, startReset] = useTransition()

  const navigate = useCallback(
    (url: string) => {
      const target = normalizeInput(url)
      if (!target) return
      setLoading(true)
      setCurrentUrl(target)
      if (iframeRef.current) {
        iframeRef.current.src = proxify(deviceId, target)
      }
    },
    [deviceId],
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(address)
  }

  const onIframeLoad = () => {
    setLoading(false)
    // Same-origin (served by our proxy) → read the real proxied URL back.
    try {
      const loc = iframeRef.current?.contentWindow?.location
      if (loc) {
        const u = new URLSearchParams(loc.search).get("u")
        if (u) {
          setCurrentUrl(u)
          setAddress(u)
        }
      }
    } catch {
      /* ignore cross-origin */
    }
  }

  const goBack = () => {
    try {
      iframeRef.current?.contentWindow?.history.back()
    } catch {
      /* ignore */
    }
  }
  const goForward = () => {
    try {
      iframeRef.current?.contentWindow?.history.forward()
    } catch {
      /* ignore */
    }
  }
  const reload = () => {
    if (currentUrl) navigate(currentUrl)
  }

  const reset = () => {
    startReset(async () => {
      await resetBrowserData(deviceId)
      setSites(0)
      setCurrentUrl(null)
      setAddress("")
      if (iframeRef.current) iframeRef.current.src = "about:blank"
    })
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 border-b border-border bg-muted/40 p-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={goBack}
              aria-label="Quay lại"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goForward}
              aria-label="Tiến tới"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={reload}
              aria-label="Tải lại"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
            </button>
            <button
              onClick={() => navigate("https://duckduckgo.com")}
              aria-label="Trang chủ"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Home className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="flex flex-1 items-center">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5">
              <Lock className="h-3.5 w-3.5 shrink-0 text-primary" />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nhập địa chỉ web hoặc từ khóa tìm kiếm..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                spellCheck={false}
                autoComplete="off"
              />
              <button type="submit" aria-label="Đi tới" className="shrink-0 text-muted-foreground hover:text-foreground">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          <button
            onClick={reset}
            disabled={isResetting}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
          >
            {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            <span className="hidden sm:inline">Xóa dữ liệu</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Shield className="h-3 w-3" />
            Phiên cô lập · {sites} site có dữ liệu
          </span>
          {SHORTCUTS.map((s) => (
            <button
              key={s.url}
              onClick={() => navigate(s.url)}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Viewport */}
      <div className="relative h-[60vh] min-h-[420px] bg-background">
        {!currentUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Shield className="h-8 w-8" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">Trình duyệt bảo mật · {deviceName}</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Mọi truy cập được thực hiện qua máy chủ với phiên hoàn toàn cô lập. IP và dấu vết
                thiết bị thật của bạn không bị lộ. Nhập địa chỉ phía trên để bắt đầu.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SHORTCUTS.slice(0, 4).map((s) => (
                <button
                  key={s.url}
                  onClick={() => navigate(s.url)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          onLoad={onIframeLoad}
          title={`Trình duyệt bảo mật ${deviceName}`}
          className="h-full w-full border-0"
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
        />
      </div>
    </div>
  )
}
