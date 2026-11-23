import { defineConfig, loadEnv } from "vite"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const clientRoot = fileURLToPath(new URL(".", import.meta.url))
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, clientRoot, "")
  const tls = env.DEV_HTTPS === "1"
  if (tls && (!env.DEV_HTTPS_CERT || !env.DEV_HTTPS_KEY)) throw new Error("Set DEV_HTTPS_CERT and DEV_HTTPS_KEY before enabling LAN HTTPS.")
  return {
    plugins: [react(), tailwindcss()],
    optimizeDeps: { include: ["html5-qrcode"] },
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    server: {
      strictPort: true,
      fs: { deny: ["**/.env", "**/.env.*", "**/.git/**", "**/.local-certs/**", "**/*.{pem,key,pfx,p12,crt}"] },
      ...(tls ? { host: env.DEV_HTTPS_HOST || "0.0.0.0", https: { cert: readFileSync(resolve(clientRoot, env.DEV_HTTPS_CERT)), key: readFileSync(resolve(clientRoot, env.DEV_HTTPS_KEY)) } } : {}),
      proxy: { "/api": { target: env.DEV_API_TARGET || "http://127.0.0.1:3000", changeOrigin: true } },
    },
  }
})
