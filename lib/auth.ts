import { betterAuth } from "better-auth"
import { admin } from "better-auth/plugins"
import { createAuthMiddleware, APIError } from "better-auth/api"
import { pool } from "@/lib/db"

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    // Public self-service sign-up is disabled. Only an admin can create
    // accounts (via the admin plugin's createUser API). The public
    // sign-up endpoint is blocked by the hook below.
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Block public self-service registration. Accounts are created
      // exclusively by an admin through the admin plugin (different endpoint).
      if (ctx.path === "/sign-up/email") {
        throw new APIError("FORBIDDEN", {
          message: "Đăng ký tài khoản hiện đang đóng. Vui lòng liên hệ quản trị viên.",
        })
      }
    }),
  },
  trustedOrigins: [
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:3000", "http://127.0.0.1:3000"]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
  ],
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})
