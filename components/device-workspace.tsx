"use client"

import { useState } from "react"
import { Globe, Smartphone } from "lucide-react"
import { SecureBrowser } from "@/components/secure-browser"
import { AndroidPhone } from "@/components/android-phone"
import type { BrowserProfileInfo } from "@/app/actions/browser"

export function DeviceWorkspace({
  deviceId,
  deviceName,
  androidVersion,
  initialSites,
  initialProfiles,
}: {
  deviceId: number
  deviceName: string
  androidVersion: string
  initialSites: number
  initialProfiles: BrowserProfileInfo[]
}) {
  const [mode, setMode] = useState<"browser" | "phone">("browser")

  return (
    <div>
      <div className="mb-4 inline-flex rounded-xl border border-border bg-card p-1">
        <button
          onClick={() => setMode("browser")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "browser"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="h-4 w-4" />
          Trình duyệt bảo mật
        </button>
        <button
          onClick={() => setMode("phone")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "phone"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Smartphone className="h-4 w-4" />
          Điện thoại Android
        </button>
      </div>

      {mode === "browser" ? (
        <SecureBrowser
          deviceId={deviceId}
          deviceName={deviceName}
          initialSites={initialSites}
          initialProfiles={initialProfiles}
        />
      ) : (
        <AndroidPhone deviceId={deviceId} deviceName={deviceName} androidVersion={androidVersion} />
      )}
    </div>
  )
}
