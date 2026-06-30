"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  Smartphone,
  Play,
  Square,
  RotateCw,
  Cpu,
  MemoryStick,
  HardDrive,
  MapPin,
  Pencil,
  Check,
  X,
  Loader2,
  Globe,
} from "lucide-react"
import { setDeviceStatus, renameDevice } from "@/app/actions/devices"

type Device = {
  id: number
  name: string
  androidVersion: string
  region: string
  plan: string
  status: string
  cpu: number
  ram: number
  storage: number
}

const statusMeta: Record<string, { label: string; dot: string; text: string }> = {
  running: { label: "Đang chạy", dot: "bg-primary", text: "text-primary" },
  stopped: { label: "Đã dừng", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  restarting: { label: "Đang khởi động lại", dot: "bg-amber-400", text: "text-amber-400" },
}

export function DeviceCard({ device }: { device: Device }) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(device.name)

  const meta = statusMeta[device.status] ?? statusMeta.stopped

  const changeStatus = (status: "running" | "stopped" | "restarting") => {
    startTransition(async () => {
      await setDeviceStatus(device.id, status)
    })
  }

  const saveName = () => {
    startTransition(async () => {
      await renameDevice(device.id, name)
      setEditing(false)
    })
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Smartphone className="h-5 w-5" />
          </span>
          <div>
            {editing ? (
              <div className="flex items-center gap-1.5">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-36 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                <button
                  onClick={saveName}
                  disabled={isPending}
                  aria-label="Lưu tên"
                  className="text-primary hover:opacity-80"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setName(device.name)
                    setEditing(false)
                  }}
                  aria-label="Hủy"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold leading-tight">{device.name}</h3>
                <button
                  onClick={() => setEditing(true)}
                  aria-label="Đổi tên thiết bị"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{device.androidVersion}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          <span className={meta.text}>{meta.label}</span>
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Cpu className="h-4 w-4" />
          <span>{device.cpu} vCPU</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MemoryStick className="h-4 w-4" />
          <span>{device.ram} GB RAM</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <HardDrive className="h-4 w-4" />
          <span>{device.storage} GB</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{device.region}</span>
        </div>
      </dl>

      <Link
        href={`/device/${device.id}`}
        className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Globe className="h-4 w-4" />
        Mở trình duyệt bảo mật
      </Link>

      <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-4">
        {device.status === "running" ? (
          <button
            onClick={() => changeStatus("stopped")}
            disabled={isPending}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
            Dừng
          </button>
        ) : (
          <button
            onClick={() => changeStatus("running")}
            disabled={isPending}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Khởi động
          </button>
        )}
        <button
          onClick={() => changeStatus("restarting")}
          disabled={isPending}
          aria-label="Khởi động lại"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
        >
          <RotateCw className="h-4 w-4" />
          <span className="hidden sm:inline">Khởi động lại</span>
        </button>
      </div>
    </div>
  )
}
