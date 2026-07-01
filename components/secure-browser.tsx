"use client"

import { useRef, useState, useTransition, useCallback, useEffect } from "react"
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
  Save,
  FolderOpen,
  Layers,
  X,
} from "lucide-react"
import {
  resetBrowserData,
  listProfiles,
  saveProfile,
  loadProfile,
  deleteProfile,
  type BrowserProfileInfo,
} from "@/app/actions/browser"

const SHORTCUTS = [
  { label: "Google", url: "https://www.google.com" },
  { label: "Bing", url: "https://www.bing.com" },
  { label: "DuckDuckGo", url: "https://duckduckgo.com" },
  { label: "Wikipedia", url: "https://vi.wikipedia.org" },
  { label: "Example", url: "https://example.com" },
]

function proxify(deviceId: number, url: string) {
  try {
    const u = new URL(url)
    return `/api/proxy/${deviceId}/${u.protocol.replace(":", "")}/${u.host}${u.pathname}${u.search}${u.hash}`
  } catch {
    return url
  }
}

function normalizeInput(raw: string): string {
  const v = raw.trim()
  if (!v) return ""
  if (/^https?:\/\//i.test(v)) return v
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v)) return "https://" + v
  return "https://www.google.com/search?q=" + encodeURIComponent(v)
}

export function SecureBrowser({
  deviceId,
  deviceName,
  initialSites,
  initialProfiles,
}: {
  deviceId: number
  deviceName: string
  initialSites: number
  initialProfiles: BrowserProfileInfo[]
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [address, setAddress] = useState("")
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sites, setSites] = useState(initialSites)
  const [isResetting, startReset] = useTransition()

  // Profiles
  const [profiles, setProfiles] = useState<BrowserProfileInfo[]>(initialProfiles)
  const [showProfiles, setShowProfiles] = useState(false)
  const [savingName, setSavingName] = useState("")
  const [busy, startBusy] = useTransition()
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 2500)
    return () => clearTimeout(t)
  }, [notice])

  const refreshProfiles = useCallback(async () => {
    setProfiles(await listProfiles(deviceId))
  }, [deviceId])

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
    try {
      const loc = iframeRef.current?.contentWindow?.location
      if (loc) {
        const m = loc.pathname.match(/^\/api\/proxy\/\d+\/(https?)\/(.+)$/)
        if (m) {
          const real = `${m[1]}://${m[2]}${loc.search}${loc.hash}`
          setCurrentUrl(real)
          setAddress(real)
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
      setNotice("Đã xóa dữ liệu phiên hiện tại")
    })
  }

  const handleSave = () => {
    const name = savingName.trim()
    if (!name) return
    startBusy(async () => {
      await saveProfile(deviceId, name)
      setSavingName("")
      await refreshProfiles()
      setNotice(`Đã lưu hồ sơ "${name}"`)
    })
  }

  const handleLoad = (p: BrowserProfileInfo) => {
    startBusy(async () => {
      const res = await loadProfile(p.id)
      setSites(res.sites ?? 0)
      setCurrentUrl(null)
      setAddress("")
      if (iframeRef.current) iframeRef.current.src = "about:blank"
      setNotice(`Đã tải hồ sơ "${p.name}"`)
    })
  }

  const handleDelete = (p: BrowserProfileInfo) => {
    startBusy(async () => {
      await deleteProfile(p.id)
      await refreshProfiles()
      setNotice(`Đã xóa hồ sơ "${p.name}"`)
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
            onClick={() => setShowProfiles((v) => !v)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              showProfiles
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Hồ sơ ({profiles.length})</span>
          </button>

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

        {notice && (
          <div
            role="status"
            className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
          >
            {notice}
          </div>
        )}

        {/* Profiles panel */}
        {showProfiles && (
          <div className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Layers className="h-4 w-4 text-primary" />
                Hồ sơ trình duyệt đã lưu
              </p>
              <button
                onClick={() => setShowProfiles(false)}
                aria-label="Đóng"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground text-pretty">
              Lưu trạng thái đăng nhập/cookie hiện tại thành hồ sơ riêng. Tải lại bất cứ lúc nào để
              chuyển nhanh giữa nhiều bộ tài khoản trên cùng một thiết bị.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <input
                value={savingName}
                onChange={(e) => setSavingName(e.target.value)}
                placeholder="Tên hồ sơ (vd: Tài khoản 1)"
                className="min-w-0 flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSave()
                }}
              />
              <button
                onClick={handleSave}
                disabled={busy || !savingName.trim()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu phiên
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {profiles.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                  Chưa có hồ sơ nào. Nhập tên và nhấn &quot;Lưu phiên&quot; để tạo hồ sơ đầu tiên.
                </p>
              ) : (
                profiles.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.siteCount} site · {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => handleLoad(p)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-60"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        Tải
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={busy}
                        aria-label={`Xóa hồ sơ ${p.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
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
