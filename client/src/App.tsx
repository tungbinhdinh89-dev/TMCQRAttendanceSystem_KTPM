import { ThemeProvider } from "@figma/astraui"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import Audit from "./features/audit/Audit"
import AppProvider from "./app/context"
import Router from "./app/router"
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
  }, [])
  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <BrowserRouter
          basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}
        >
          <MuiBridge>
            <Routes>
              <Route path="/audit" element={<Audit />} />
              <Route path="*" element={<AppProvider><Router /></AppProvider>} />
            </Routes>
          </MuiBridge>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
