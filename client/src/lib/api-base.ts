/** Same-origin proxy prevents HTTP API mixed-content and cookie/CORS issues on LAN HTTPS. */
export const apiBase = (import.meta.env.DEV && typeof window !== "undefined" && window.location.protocol === "https:"
  ? "/api" : import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "")
