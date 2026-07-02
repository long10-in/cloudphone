"use client"

import { useState, useTransition, useEffect } from "react"
import {
  Globe,
  Loader2,
  Play,
  Square,
  Trash2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"
import {
  getCloudStatus,
  startCloudBrowser,
  stopCloudBrowser,
  resetCloudBrowser,
  navigateCloud,
  type CloudStatus,
} from "@/app/actions/cloud-browser"

export function CloudBrowser({
  deviceId,
  deviceName,
}: {
  deviceId: number
  deviceName: string
}) {
  const [status, setStatus] = useState<CloudStatus | null>(null)
  const [address, setAddress] = useState("")
  const [currentUrl, setCurrentUrl] = useState("https://www.google.com")
  const [pending, startTransition] = useTransition()
  const [navPending, startNav] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [disconnected, setDisconnected] = useState(false)

  // Browserbase Live View gửi postMessage này khi phiên mất kết nối. Nếu không
  // lắng nghe, người dùng sẽ thấy nguyên dialog gốc của Chrome DevTools
  // ("Debugging connection was closed…") thay vì thông báo dễ hiểu.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data === "browserbase-disconnected") {
        setDisconnected(true)
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  useEffect(() => {
    getCloudStatus(deviceId)
      .then((s) => {
        setStatus(s)
        setLoadError(s.error ?? null)
      })
      .catch((e) => {
        // A real failure (DB/auth/API) — do NOT disguise it as "not configured".
        setLoadError(e instanceof Error ? e.message : "Không tải được trạng thái")
        setStatus({ enabled: true, running: false, liveViewUrl: null })
      })
  }, [deviceId])

  function handleStart() {
    setError(null)
    setDisconnected(false)
    startTransition(async () => {
      try {
        const s = await startCloudBrowser(deviceId)
        setStatus(s)
        if (s.error) {
          setError(s.error)
          return
        }
        setAddress("https://www.google.com")
        setCurrentUrl("https://www.google.com")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không thể khởi động")
      }
    })
  }

  function handleStop() {
    startTransition(async () => {
      try {
        const s = await stopCloudBrowser(deviceId)
        setStatus(s)
        if (s.error) setError(s.error)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi dừng")
      }
    })
  }

  function handleReset() {
    if (!confirm("Xóa toàn bộ dữ liệu (cookie, đăng nhập) của thiết bị này?")) return
    startTransition(async () => {
      try {
        const s = await resetCloudBrowser(deviceId)
        setStatus(s)
        if (s.error) setError(s.error)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi xóa dữ liệu")
      }
    })
  }

  function handleNavigate(e?: React.FormEvent) {
    e?.preventDefault()
    if (!address.trim() || !status?.running) return
    setError(null)
    startNav(async () => {
      try {
        const res = await navigateCloud(deviceId, address)
        if (res.error) {
          setError(res.error)
          return
        }
        setCurrentUrl(res.url)
        setAddress(res.url)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể mở trang")
      }
    })
  }

  function quickGo(url: string) {
    setAddress(url)
    if (!status?.running) return
    setError(null)
    startNav(async () => {
      try {
        const res = await navigateCloud(deviceId, url)
        if (res.error) {
          setError(res.error)
          return
        }
        setCurrentUrl(res.url)
        setAddress(res.url)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể mở trang")
      }
    })
  }

  // Loading initial status
  if (status === null) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-border bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Browserbase not configured
  if (!status.enabled) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Globe className="h-5 w-5 text-muted-foreground" />
          </span>
          <div>
            <p className="font-semibold">Cloud Browser chưa sẵn sàng</p>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              Cần cấu hình BROWSERBASE_API_KEY và BROWSERBASE_PROJECT_ID để chạy trình duyệt
              Chromium thật trên đám mây.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const quickLinks = [
    { label: "Google", url: "https://www.google.com" },
    { label: "Facebook", url: "https://www.facebook.com" },
    { label: "YouTube", url: "https://www.youtube.com" },
    { label: "Gmail", url: "https://mail.google.com" },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border bg-muted/40 p-3">
        <div className="flex items-center gap-2">
          <form onSubmit={handleNavigate} className="flex flex-1 items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nhập địa chỉ hoặc từ khóa tìm kiếm…"
                disabled={!status.running}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
              />
              {navPending && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
            </div>
            <button
              type="submit"
              disabled={!status.running || navPending}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              aria-label="Đi tới"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {status.running ? (
            <>
              <button
                onClick={handleStop}
                disabled={pending}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                Dừng
              </button>
              <button
                onClick={handleReset}
                disabled={pending}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Xóa dữ liệu
              </button>
            </>
          ) : (
            <button
              onClick={handleStart}
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Khởi động
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3 w-3" />
            {status.running ? "Chromium thật · phiên cô lập" : "Đã dừng"}
          </span>
          {quickLinks.map((q) => (
            <button
              key={q.url}
              onClick={() => quickGo(q.url)}
              disabled={!status.running || navPending}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-40"
            >
              {q.label}
            </button>
          ))}
        </div>

        {(error || loadError) && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error || loadError}
          </p>
        )}
      </div>

      {/* Live view */}
      <div className="relative aspect-[390/844] max-h-[70vh] w-full bg-black sm:aspect-auto sm:h-[70vh]">
        {status.running && status.liveViewUrl ? (
          <>
            <iframe
              src={status.liveViewUrl}
              title={`Cloud Browser - ${deviceName}`}
              className="h-full w-full"
              // Chỉ 2 quyền này theo đúng khuyến nghị chính thức của Browserbase.
              // Các quyền dư thừa trước đây (allow-popups, allow-modals…) cho phép
              // trang bên trong mở cửa sổ/điều hướng thoát khỏi khung live view.
              sandbox="allow-same-origin allow-scripts"
              allow="clipboard-read; clipboard-write"
            />
            {disconnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 px-6 text-center">
                <p className="font-semibold text-white">Mất kết nối tới phiên trình duyệt</p>
                <p className="max-w-xs text-sm text-white/70">
                  Kết nối tới máy chủ đám mây bị gián đoạn. Bấm nút bên dưới để khởi động lại
                  phiên.
                </p>
                <button
                  onClick={handleStart}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Kết nối lại
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </span>
            <div>
              <p className="font-semibold text-background-foreground text-balance">
                Trình duyệt đám mây thật
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground text-pretty">
                Nhấn Khởi động để bật một trình duyệt Chromium thật chạy trên đám mây. Mọi thao
                tác diễn ra trên máy chủ — ẩn IP và thiết bị thật của bạn, đăng nhập được mọi
                trang như Google, Facebook.
              </p>
            </div>
            <button
              onClick={handleStart}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Khởi động trình duyệt
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
