"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { CloudCog, Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { APP_VERSION } from "@/lib/version"

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await authClient.signIn.email({ email, password })

    if (error) {
      setLoading(false)
      setError(
        error.message === "Invalid email or password"
          ? "Email hoặc mật khẩu không đúng."
          : (error.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại."),
      )
      return
    }

    // Route by role
    const role = data?.user?.role
    router.push(role === "admin" ? "/admin" : "/dashboard")
    router.refresh()
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <CloudCog className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Đăng nhập NebulaPhone</h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Truy cập bảng điều khiển và quản lý điện thoại đám mây của bạn.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
              placeholder="ban@email.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <p className="mt-2 text-center text-xs text-muted-foreground text-pretty">
            Đăng ký tài khoản hiện đang đóng. Vui lòng liên hệ quản trị viên để được cấp tài khoản.
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Phiên bản {APP_VERSION}
        </p>
      </div>
    </main>
  )
}
