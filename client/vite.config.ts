import { defineConfig } from "vite"

import react from "@vitejs/plugin-react"

import tailwindcss from "@tailwindcss/vite"

import { fileURLToPath } from "node:url"

import siteConfiguration from "./.figma/make/site.json"

import {
  figmaErrorOverlayReplay,
  figmaMakeKitPlugin,
  figmaReactRefreshBoundaryFallback,
  figmaSiteConfiguration,
} from "./.figma/vite-plugins"

export default defineConfig(({ mode }) => {
  const previewBuild = mode === "development"

  return {
    base: process.env.FIGMA_PUBLIC_URL
      ? `${process.env.FIGMA_PUBLIC_URL}/`
      : "/",

    plugins: [
      react(),

      tailwindcss(),

      figmaSiteConfiguration(siteConfiguration),

      figmaErrorOverlayReplay(),

      figmaReactRefreshBoundaryFallback(),

      figmaMakeKitPlugin({ storiesGlob: "/src/**/*.stories.{ts,tsx,js,jsx}" }),
    ],

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },

    build: {
      sourcemap: previewBuild ? "inline" : false,

      minify: !previewBuild,
    },

    server: {
      host: process.env.FIGMA_DEV_SERVER_HOST || "0.0.0.0",

      port: Number(process.env.PORT || 5173),

      strictPort: true,

      watch: { ignored: ["**/.figma/**"] },
    },

    preview: {
      host: process.env.FIGMA_DEV_SERVER_HOST || "0.0.0.0",

      port: Number(process.env.PORT || 4173),
    },
  }
})
