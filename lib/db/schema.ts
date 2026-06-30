import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
} from "drizzle-orm/pg-core"

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").default("user"),
  banned: boolean("banned").default(false),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonatedBy"),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const device = pgTable("device", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  name: text("name").notNull(),
  androidVersion: text("androidVersion").notNull().default("Android 13"),
  region: text("region").notNull().default("Singapore"),
  plan: text("plan").notNull().default("basic"),
  status: text("status").notNull().default("running"),
  cpu: integer("cpu").notNull().default(4),
  ram: integer("ram").notNull().default(4),
  storage: integer("storage").notNull().default(32),
  lastActiveAt: timestamp("lastActiveAt").notNull().defaultNow(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const browserSession = pgTable("browser_session", {
  deviceId: integer("deviceId").primaryKey(),
  userId: text("userId").notNull(),
  cookies: text("cookies").notNull().default("{}"),
  userAgent: text("userAgent"),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const browserProfile = pgTable("browser_profile", {
  id: serial("id").primaryKey(),
  deviceId: integer("deviceId").notNull(),
  userId: text("userId").notNull(),
  name: text("name").notNull(),
  cookies: text("cookies").notNull().default("{}"),
  siteCount: integer("siteCount").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})
