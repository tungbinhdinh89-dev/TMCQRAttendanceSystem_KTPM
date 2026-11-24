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
import { lazy, Suspense, useEffect } from "react"
const History = lazy(() => import("./features/attendance-history/History"))
const Scanner = lazy(() => import("./features/scanner/Scanner"))
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
              <Route element={<ServerAccess />}>
                <Route path="/audit" element={<Audit />} />
                <Route path="/management" element={<Management />} />
                <Route path="/management/employees/:employeeId" element={<Management />} />
                <Route path="/scanner" element={<Suspense fallback={<div role="status">Đang mở máy quét…</div>}><Scanner /></Suspense>} />
                <Route path="/attendance" element={<Suspense fallback={<div role="status">Đang mở lịch sử…</div>}><History mode="attendance" /></Suspense>} />
                <Route path="/gate-history" element={<Suspense fallback={<div role="status">Đang mở nhật ký…</div>}><History mode="gate" /></Suspense>} />
                <Route path="/attendance-summary" element={<Suspense fallback={<div role="status">Đang mở báo cáo…</div>}><History mode="summary" /></Suspense>} />
                <Route path="/qr" element={<Qr />} />
                <Route path="/mobile/ma-qr" element={<Qr />} />
                <Route path="/workspace" element={<div />} />
              </Route>
              <Route path="*" element={<ServerAccess legacy />} />
            </Routes>
          </MuiBridge>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
