import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "NebulaPhone — Điện thoại đám mây, thiết bị thứ 2 của bạn",
  description:
    "Sở hữu chiếc điện thoại Android thứ 2 chạy trên đám mây. Truy cập từ mọi trình duyệt, hoạt động 24/7, chạy app & game, nuôi nick và tự động hóa an toàn.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#16201e",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
