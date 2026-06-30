"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Smartphone,
  Plus,
  Trash2,
  Ban,
  ShieldCheck,
  Loader2,
  X,
  ShieldAlert,
} from "lucide-react"
import {
  createUserAccount,
  deleteUserAccount,
  toggleBan,
  createDevice,
  deleteDevice,
  type ActionResult,
} from "@/app/actions/admin"

type AdminUser = {
  id: string
  name: string
  email: string
  role: string
  banned: boolean
  deviceCount: number
}

type AdminDevice = {
  id: number
  name: string
  androidVersion: string
  region: string
  plan: string
  status: string
  cpu: number
  ram: number
  storage: number
  userId: string
  ownerName: string | null
  ownerEmail: string | null
}

const REGIONS = ["Singapore", "Hong Kong", "Tokyo", "US West", "Frankfurt"]
const ANDROID_VERSIONS = ["Android 11", "Android 12", "Android 13", "Android 14"]

export function AdminPanel({
  users,
  devices,
}: {
  users: AdminUser[]
  devices: AdminDevice[]
}) {
  const [tab, setTab] = useState<"users" | "devices">("users")
  const [showUserModal, setShowUserModal] = useState(false)
  const [showDeviceModal, setShowDeviceModal] = useState(false)

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Bảng quản trị</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý tài khoản người dùng và điện thoại đám mây trên toàn hệ thống.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Người dùng" value={users.length} />
        <StatCard icon={Smartphone} label="Tổng thiết bị" value={devices.length} />
        <StatCard
          icon={ShieldCheck}
          label="Quản trị viên"
          value={users.filter((u) => u.role === "admin").length}
        />
      </div>

      <div className="mt-8 flex items-center gap-1 border-b border-border">
        <TabButton active={tab === "users"} onClick={() => setTab("users")} icon={Users}>
          Người dùng
        </TabButton>
        <TabButton active={tab === "devices"} onClick={() => setTab("devices")} icon={Smartphone}>
          Thiết bị
        </TabButton>
      </div>

      {tab === "users" ? (
        <UsersTab users={users} onAdd={() => setShowUserModal(true)} />
      ) : (
        <DevicesTab devices={devices} onAdd={() => setShowDeviceModal(true)} />
      )}

      {showUserModal && <CreateUserModal onClose={() => setShowUserModal(false)} />}
      {showDeviceModal && (
        <CreateDeviceModal users={users} onClose={() => setShowDeviceModal(false)} />
      )}
    </main>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-semibold leading-tight">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}

function UsersTab({ users, onAdd }: { users: AdminUser[]; onAdd: () => void }) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const run = (id: string, fn: () => Promise<ActionResult>) => {
    setPendingId(id)
    setError(null)
    startTransition(async () => {
      const res = await fn()
      setPendingId(null)
      if (!res.ok) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tài khoản ({users.length})</h2>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Tạo tài khoản
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3 font-medium">Tên</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Vai trò</th>
              <th className="px-4 py-3 font-medium">Thiết bị</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 text-right font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  {u.role === "admin" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      <ShieldCheck className="h-3 w-3" /> Admin
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Người dùng</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.deviceCount}</td>
                <td className="px-4 py-3">
                  {u.banned ? (
                    <span className="text-red-400">Đã khóa</span>
                  ) : (
                    <span className="text-primary">Hoạt động</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => run(u.id, () => toggleBan(u.id, !u.banned))}
                      disabled={isPending && pendingId === u.id}
                      aria-label={u.banned ? "Mở khóa" : "Khóa tài khoản"}
                      title={u.banned ? "Mở khóa" : "Khóa tài khoản"}
                      className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    >
                      {isPending && pendingId === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : u.banned ? (
                        <ShieldCheck className="h-4 w-4" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Xóa tài khoản ${u.email}? Hành động này không thể hoàn tác.`)) {
                          run(u.id, () => deleteUserAccount(u.id))
                        }
                      }}
                      disabled={isPending && pendingId === u.id}
                      aria-label="Xóa tài khoản"
                      title="Xóa tài khoản"
                      className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DevicesTab({ devices, onAdd }: { devices: AdminDevice[]; onAdd: () => void }) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const remove = (id: number) => {
    if (!confirm("Xóa thiết bị này?")) return
    setPendingId(id)
    setError(null)
    startTransition(async () => {
      const res = await deleteDevice(id)
      setPendingId(null)
      if (!res.ok) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Thiết bị ({devices.length})</h2>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Cấp thiết bị
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3 font-medium">Thiết bị</th>
              <th className="px-4 py-3 font-medium">Chủ sở hữu</th>
              <th className="px-4 py-3 font-medium">Cấu hình</th>
              <th className="px-4 py-3 font-medium">Khu vực</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 text-right font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.androidVersion}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {d.ownerEmail ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {d.cpu}vCPU · {d.ram}GB · {d.storage}GB
                </td>
                <td className="px-4 py-3 text-muted-foreground">{d.region}</td>
                <td className="px-4 py-3">
                  <span className={d.status === "running" ? "text-primary" : "text-muted-foreground"}>
                    {d.status === "running" ? "Đang chạy" : d.status === "restarting" ? "Khởi động lại" : "Đã dừng"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <button
                      onClick={() => remove(d.id)}
                      disabled={isPending && pendingId === d.id}
                      aria-label="Xóa thiết bị"
                      className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                    >
                      {isPending && pendingId === d.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
const labelClass = "text-sm font-medium"

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "user" | "admin",
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createUserAccount(form)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal title="Tạo tài khoản mới" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Họ tên</label>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Email</label>
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Mật khẩu</label>
          <input
            type="text"
            className={inputClass}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            placeholder="Tối thiểu 8 ký tự"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Vai trò</label>
          <select
            className={inputClass}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as "user" | "admin" })}
          >
            <option value="user">Người dùng</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>

        {error && (
          <p className="flex items-center gap-2 text-sm text-red-400">
            <ShieldAlert className="h-4 w-4" /> {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Tạo tài khoản
        </button>
      </form>
    </Modal>
  )
}

function CreateDeviceModal({
  users,
  onClose,
}: {
  users: AdminUser[]
  onClose: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    userId: users[0]?.id ?? "",
    name: "",
    androidVersion: "Android 13",
    region: "Singapore",
    plan: "pro",
    cpu: 4,
    ram: 8,
    storage: 64,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createDevice(form)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal title="Cấp điện thoại đám mây" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Gán cho người dùng</label>
          <select
            className={inputClass}
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            required
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Tên thiết bị</label>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="VD: Galaxy Cloud 01"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Android</label>
            <select
              className={inputClass}
              value={form.androidVersion}
              onChange={(e) => setForm({ ...form, androidVersion: e.target.value })}
            >
              {ANDROID_VERSIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Khu vực</label>
            <select
              className={inputClass}
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>vCPU</label>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.cpu}
              onChange={(e) => setForm({ ...form, cpu: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>RAM (GB)</label>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.ram}
              onChange={(e) => setForm({ ...form, ram: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Bộ nhớ (GB)</label>
            <input
              type="number"
              min={8}
              className={inputClass}
              value={form.storage}
              onChange={(e) => setForm({ ...form, storage: Number(e.target.value) })}
            />
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-2 text-sm text-red-400">
            <ShieldAlert className="h-4 w-4" /> {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || users.length === 0}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Cấp thiết bị
        </button>
      </form>
    </Modal>
  )
}
