import { ThemeProvider } from "@figma/astraui"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router-dom"
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
          <AppProvider>
            <MuiBridge>
              <Router />
            </MuiBridge>
          </AppProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
