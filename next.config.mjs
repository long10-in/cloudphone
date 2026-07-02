/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // playwright-core must NOT be bundled by the server compiler; it uses dynamic
  // requires that break in the serverless output. Keeping it external is what
  // makes chromium.connectOverCDP() work in production (Vercel serverless).
  serverExternalPackages: ["playwright-core"],
  // Marking playwright-core external stops Next.js from bundling its JS, but
  // Vercel's file tracing then misses the non-JS assets it reads at runtime
  // (e.g. browsers.json), causing "Cannot find module .../browsers.json".
  // Force-include the whole package into every serverless function.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/playwright-core/**/*"],
  },
}

export default nextConfig
