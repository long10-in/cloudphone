"use server"

import { db } from "@/lib/db"
import { device } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

export async function getMyDevices() {
  const userId = await getUserId()
  return db
    .select()
    .from(device)
    .where(eq(device.userId, userId))
    .orderBy(desc(device.createdAt))
}

export async function setDeviceStatus(id: number, status: "running" | "stopped" | "restarting") {
  const userId = await getUserId()
  await db
    .update(device)
    .set({ status, lastActiveAt: new Date() })
    .where(and(eq(device.id, id), eq(device.userId, userId)))
  revalidatePath("/dashboard")
}

export async function renameDevice(id: number, name: string) {
  const userId = await getUserId()
  const trimmed = name.trim()
  if (!trimmed) throw new Error("Tên thiết bị không được để trống")
  await db
    .update(device)
    .set({ name: trimmed })
    .where(and(eq(device.id, id), eq(device.userId, userId)))
  revalidatePath("/dashboard")
}
