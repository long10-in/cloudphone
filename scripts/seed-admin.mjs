import { auth } from "../lib/auth.ts"
import { db, pool } from "../lib/db/index.ts"
import { user, account } from "../lib/db/schema.ts"
import { eq } from "drizzle-orm"
import { randomUUID } from "node:crypto"

const ADMIN_EMAIL = "nguyenxuangame1@gmail.com"
const ADMIN_PASSWORD = "Admin1028.1028#@"
const ADMIN_NAME = "Quản trị viên"

async function main() {
  const existing = await db.select().from(user).where(eq(user.email, ADMIN_EMAIL))

  const ctx = await auth.$context
  const hashed = await ctx.password.hash(ADMIN_PASSWORD)

  if (existing.length > 0) {
    const u = existing[0]
    await db.update(user).set({ role: "admin", emailVerified: true }).where(eq(user.id, u.id))
    // Ensure credential account password is up to date
    const accts = await db.select().from(account).where(eq(account.userId, u.id))
    const cred = accts.find((a) => a.providerId === "credential")
    if (cred) {
      await db.update(account).set({ password: hashed }).where(eq(account.id, cred.id))
    } else {
      await db.insert(account).values({
        id: randomUUID(),
        accountId: u.id,
        providerId: "credential",
        userId: u.id,
        password: hashed,
      })
    }
    console.log("[seed] Admin account updated:", ADMIN_EMAIL)
  } else {
    const userId = randomUUID()
    await db.insert(user).values({
      id: userId,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      emailVerified: true,
      role: "admin",
    })
    await db.insert(account).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashed,
    })
    console.log("[seed] Admin account created:", ADMIN_EMAIL)
  }

  await pool.end()
  process.exit(0)
}

main().catch((err) => {
  console.error("[seed] Failed:", err)
  process.exit(1)
})
