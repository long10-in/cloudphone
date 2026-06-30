"use server"

import { db } from "@/lib/db"
import { user, device, account, session } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

async function requireAdminId() {
  const s = await auth.api.getSession({ headers: await headers() })
  if (!s?.user) throw new Error("Unauthorized")
  if (s.user.role !== "admin") throw new Error("Forbidden")
  return s.user.id
}

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function listUsers() {
  await requireAdminId()
  const users = await db.select().from(user).orderBy(desc(user.createdAt))
  const devices = await db.select().from(device)
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role ?? "user",
    banned: u.banned ?? false,
    createdAt: u.createdAt,
    deviceCount: devices.filter((d) => d.userId === u.id).length,
  }))
}

export async function createUserAccount(formData: {
  name: string
  email: string
  password: string
  role: "user" | "admin"
}): Promise<ActionResult> {
  try {
    await requireAdminId()
    const email = formData.email.trim().toLowerCase()
    const name = formData.name.trim()
    if (!name || !email || formData.password.length < 8) {
      return { ok: false, error: "Vui lòng nhập đầy đủ thông tin, mật khẩu tối thiểu 8 ký tự." }
    }
    const existing = await db.select().from(user).where(eq(user.email, email))
    if (existing.length > 0) {
      return { ok: false, error: "Email này đã được sử dụng." }
    }
    await auth.api.createUser({
      body: {
        email,
        password: formData.password,
        name,
        role: formData.role,
      },
      headers: await headers(),
    })
    revalidatePath("/admin")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không thể tạo tài khoản." }
  }
}

export async function deleteUserAccount(userId: string): Promise<ActionResult> {
  try {
    const adminId = await requireAdminId()
    if (userId === adminId) {
      return { ok: false, error: "Không thể xóa chính tài khoản đang đăng nhập." }
    }
    // Remove dependent rows first (devices have no FK cascade)
    await db.delete(device).where(eq(device.userId, userId))
    await db.delete(session).where(eq(session.userId, userId))
    await db.delete(account).where(eq(account.userId, userId))
    await db.delete(user).where(eq(user.id, userId))
    revalidatePath("/admin")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không thể xóa tài khoản." }
  }
}

export async function toggleBan(userId: string, banned: boolean): Promise<ActionResult> {
  try {
    const adminId = await requireAdminId()
    if (userId === adminId) {
      return { ok: false, error: "Không thể khóa chính tài khoản đang đăng nhập." }
    }
    await db.update(user).set({ banned }).where(eq(user.id, userId))
    if (banned) {
      await db.delete(session).where(eq(session.userId, userId))
    }
    revalidatePath("/admin")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Thao tác thất bại." }
  }
}

export async function listAllDevices() {
  await requireAdminId()
  const rows = await db
    .select({
      id: device.id,
      name: device.name,
      androidVersion: device.androidVersion,
      region: device.region,
      plan: device.plan,
      status: device.status,
      cpu: device.cpu,
      ram: device.ram,
      storage: device.storage,
      userId: device.userId,
      ownerName: user.name,
      ownerEmail: user.email,
    })
    .from(device)
    .leftJoin(user, eq(device.userId, user.id))
    .orderBy(desc(device.createdAt))
  return rows
}

export async function createDevice(formData: {
  userId: string
  name: string
  androidVersion: string
  region: string
  plan: string
  cpu: number
  ram: number
  storage: number
}): Promise<ActionResult> {
  try {
    await requireAdminId()
    if (!formData.userId || !formData.name.trim()) {
      return { ok: false, error: "Vui lòng chọn người dùng và nhập tên thiết bị." }
    }
    await db.insert(device).values({
      userId: formData.userId,
      name: formData.name.trim(),
      androidVersion: formData.androidVersion,
      region: formData.region,
      plan: formData.plan,
      cpu: formData.cpu,
      ram: formData.ram,
      storage: formData.storage,
      status: "running",
    })
    revalidatePath("/admin")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không thể tạo thiết bị." }
  }
}

export async function deleteDevice(id: number): Promise<ActionResult> {
  try {
    await requireAdminId()
    await db.delete(device).where(eq(device.id, id))
    revalidatePath("/admin")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không thể xóa thiết bị." }
  }
}
