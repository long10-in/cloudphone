"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import {
  Signal,
  Wifi,
  BatteryFull,
  ChevronLeft,
  Circle,
  Square,
  Globe,
  Search,
  Loader2,
  RotateCw,
} from "lucide-react"

type AppDef = {
  id: string
  label: string
  url: string
  color: string
  letter: string
}

const APPS: AppDef[] = [
  { id: "chrome", label: "Trình duyệt", url: "https://duckduckgo.com", color: "#3b82f6", letter: "B" },
  { id: "youtube", label: "YouTube", url: "https://m.youtube.com", color: "#ef4444", letter: "Y" },
  { id: "facebook", label: "Facebook", url: "https://m.facebook.com", color: "#1877f2", letter: "f" },
  { id: "x", label: "X", url: "https://x.com", color: "#0f172a", letter: "X" },
  { id: "wiki", label: "Wikipedia", url: "https://vi.m.wikipedia.org", color: "#64748b", letter: "W" },
  { id: "reddit", label: "Reddit", url: "https://www.reddit.com", color: "#ff4500", letter: "R" },
  { id: "gmail", label: "Gmail", url: "https://mail.google.com", color: "#ea4335", letter: "M" },
  { id: "maps", label: "Maps", url: "https://www.google.com/maps", color: "#34a853", letter: "M" },
  { id: "shopee", label: "Shopee", url: "https://shopee.vn", color: "#ee4d2d", letter: "S" },
  { id: "tiktok", label: "TikTok", url: "https://www.tiktok.com", color: "#111827", letter: "T" },
  { id: "telegram", label: "Telegram", url: "https://web.telegram.org", color: "#229ed9", letter: "T" },
  { id: "store", label: "App Store", url: "https://play.google.com/store", color: "#22c55e", letter: "P" },
]

function proxify(deviceId: number, url: string) {
  return `/api/proxy?d=${deviceId}&u=${encodeURIComponent(url)}`
}

function AppIcon({ app, onOpen }: { app: AppDef; onOpen: (a: AppDef) => void }) {
  return (
    <button
      onClick={() => onOpen(app)}
      className="flex flex-col items-center gap-1.5 outline-none"
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg transition-transform active:scale-90"
        style={{ backgroundColor: app.color }}
      >
        {app.letter}
      </span>
      <span className="max-w-[64px] truncate text-[11px] text-white/90 drop-shadow">{app.label}</span>
    </button>
  )
}

export function AndroidPhone({
  deviceId,
  deviceName,
  androidVersion,
}: {
  deviceId: number
  deviceName: string
  androidVersion: string
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [openApp, setOpenApp] = useState<AppDef | null>(null)
  const [loading, setLoading] = useState(false)
  const [clock, setClock] = useState("")
  const [addr, setAddr] = useState("")

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setClock(
        d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }),
      )
    }
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [])

  const open = useCallback((app: AppDef) => {
    setOpenApp(app)
    setLoading(true)
    setAddr(app.url)
  }, [])

  const home = () => {
    setOpenApp(null)
    setLoading(false)
  }

  const reloadApp = () => {
    if (openApp && iframeRef.current) {
      setLoading(true)
      // eslint-disable-next-line no-self-assign
      iframeRef.current.src = iframeRef.current.src
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Phone frame */}
      <div className="relative w-full max-w-[360px]">
        <div className="relative overflow-hidden rounded-[2.5rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl">
          {/* Screen */}
          <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[1.9rem] bg-neutral-950">
            {/* Status bar */}
            <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-2 text-[11px] font-medium text-white">
              <span>{clock}</span>
              <div className="flex items-center gap-1">
                <Signal className="h-3 w-3" />
                <Wifi className="h-3 w-3" />
                <BatteryFull className="h-3.5 w-3.5" />
              </div>
            </div>

            {openApp ? (
              <div className="absolute inset-0 z-10 flex flex-col bg-white pt-7">
                {/* App URL bar */}
                <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-100 px-2 py-1.5">
                  <div className="flex flex-1 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs text-neutral-600 shadow-sm">
                    <Search className="h-3 w-3 shrink-0 text-neutral-400" />
                    <span className="truncate">{addr}</span>
                  </div>
                  <button
                    onClick={reloadApp}
                    aria-label="Tải lại"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 active:bg-neutral-200"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="relative flex-1 bg-white">
                  {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
                      <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                    </div>
                  )}
                  <iframe
                    ref={iframeRef}
                    src={proxify(deviceId, openApp.url)}
                    title={openApp.label}
                    onLoad={() => setLoading(false)}
                    className="h-full w-full border-0"
                    sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
                  />
                </div>
              </div>
            ) : (
              /* Home screen */
              <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-emerald-900 via-neutral-900 to-black pt-12">
                <div className="px-5 pb-4 text-center text-white">
                  <p className="text-4xl font-light tracking-tight">{clock}</p>
                  <p className="mt-0.5 text-xs text-white/70">{deviceName} · {androidVersion}</p>
                </div>
                <div className="grid flex-1 grid-cols-4 content-start gap-x-2 gap-y-4 overflow-y-auto px-4 py-2">
                  {APPS.map((app) => (
                    <AppIcon key={app.id} app={app} onOpen={open} />
                  ))}
                </div>
                {/* Dock */}
                <div className="mx-4 mb-4 flex items-center justify-around rounded-3xl bg-white/10 px-4 py-3 backdrop-blur">
                  {APPS.slice(0, 4).map((app) => (
                    <AppIcon key={`dock-${app.id}`} app={app} onOpen={open} />
                  ))}
                </div>
              </div>
            )}

            {/* Navigation bar */}
            <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-around bg-black/40 py-2 backdrop-blur">
              <button
                onClick={() => {
                  if (openApp) {
                    try {
                      iframeRef.current?.contentWindow?.history.back()
                    } catch {
                      /* ignore */
                    }
                  }
                }}
                aria-label="Quay lại"
                className="text-white/80 active:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={home} aria-label="Màn hình chính" className="text-white/80 active:text-white">
                <Circle className="h-4 w-4" />
              </button>
              <button onClick={home} aria-label="Ứng dụng gần đây" className="text-white/80 active:text-white">
                <Square className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-center text-xs text-muted-foreground">
        <Globe className="h-3.5 w-3.5 text-primary" />
        Mọi ứng dụng chạy qua phiên cô lập của thiết bị — chia sẻ chung đăng nhập với trình duyệt bảo mật.
      </p>
    </div>
  )
}
