import { ThemeProvider } from "@figma/astraui"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import Audit from "./features/audit/Audit"
import Management from "./features/management/Management"
import Qr from "./features/qr/Qr"
import Landing from "./features/public/Landing"
import Login from "./features/auth/Login"
import ServerAccess from "./features/auth/ServerAccess"
import MuiBridge from "./styles/mui-theme"
import { useEffect } from "react"
const client = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: true },
  },
})
export default function App() {
  useEffect(() => {
    document.title = "TMC Access — Kết nối con người, an tâm vận hành"
    document.documentElement.lang = "vi"
    // Discard obsolete demo identity/data; browser storage never authorizes real routes.
    try { localStorage.removeItem("tmc-access-session:v1"); localStorage.removeItem("tmc-access-db:v1") } catch { /* Storage can be disabled. */ }
  }, [])
  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <BrowserRouter
          basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}
        >
          <MuiBridge>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dang-nhap" element={<Login />} />
              <Route path="/audit" element={<ServerAccess><Audit /></ServerAccess>} />
              <Route path="/management" element={<ServerAccess><Management /></ServerAccess>} />
              <Route path="/qr" element={<ServerAccess><Qr /></ServerAccess>} />
              <Route path="/mobile/ma-qr" element={<ServerAccess><Qr /></ServerAccess>} />
              <Route path="/workspace" element={<ServerAccess workspace />} />
              <Route path="*" element={<ServerAccess legacy />} />
            </Routes>
          </MuiBridge>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
