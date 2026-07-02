/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // playwright-core must NOT be bundled by the server compiler; it uses dynamic
  // requires that break in the serverless output. Keeping it external is what
  // makes chromium.connectOverCDP() work in production (Vercel serverless).
  serverExternalPackages: ["playwright-core"],
}

export default nextConfig
