"use client"

import { useState } from "react"
import { Cloud, Globe, Smartphone } from "lucide-react"
import { CloudBrowser } from "@/components/cloud-browser"
import { SecureBrowser } from "@/components/secure-browser"
import { AndroidPhone } from "@/components/android-phone"
import type { BrowserProfileInfo } from "@/app/actions/browser"

type Mode = "cloud" | "browser" | "phone"

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
  const [mode, setMode] = useState<Mode>("cloud")

  const tabs: { id: Mode; label: string; icon: typeof Cloud }[] = [
    { id: "cloud", label: "Cloud Browser", icon: Cloud },
    { id: "browser", label: "Trình duyệt nhanh", icon: Globe },
    { id: "phone", label: "Điện thoại Android", icon: Smartphone },
  ]

  return (
    <div>
      <div className="mb-4 inline-flex flex-wrap rounded-xl border border-border bg-card p-1">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                mode === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {mode === "cloud" && <CloudBrowser deviceId={deviceId} deviceName={deviceName} />}
      {mode === "browser" && (
        <SecureBrowser
          deviceId={deviceId}
          deviceName={deviceName}
          initialSites={initialSites}
          initialProfiles={initialProfiles}
        />
      )}
      {mode === "phone" && (
        <AndroidPhone deviceId={deviceId} deviceName={deviceName} androidVersion={androidVersion} />
      )}
    </div>
  )
}
