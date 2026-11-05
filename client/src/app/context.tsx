import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Context as ReactContext,
  type ReactNode,
} from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Toast, Button } from "@figma/astraui"
import { api } from "../data/api"
import type { Account, Database } from "../data/types"

interface AppState {
  db: Database
  account?: Account
  busy: boolean
  login: (id: string) => void
  logout: () => void
  notify: (message: string, error?: boolean) => void
  run: (task: () => Promise<unknown>, message?: string) => Promise<boolean>
}
// Keep providers and consumers on the same context across Vite hot updates.
const Context: ReactContext<AppState | null> =
  import.meta.hot?.data.appContext ?? createContext<AppState | null>(null)
if (import.meta.hot) {
  import.meta.hot.data.appContext = Context
}
interface ToastState {
  message: string
  error: boolean
}
export default function AppProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const {
    data: db,
    error,
    refetch,
  } = useQuery({ queryKey: ["database"], queryFn: api.getDatabase })
  const [session, setSession] = useState(() => {
    try {
      return localStorage.getItem("tmc-access-session:v1") || ""
    } catch {
      return ""
    }
  })
  const [pending, setPending] = useState(0)
  const [toast, setToast] = useState<ToastState | null>(null)
  const notify = (message: string, error = false) =>
    setToast({ message, error })
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    if (db && sessionStorage.getItem("tmc-recovered")) {
      notify("Dữ liệu demo đã được khôi phục an toàn.")
      sessionStorage.removeItem("tmc-recovered")
    }
  }, [db])
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === "tmc-access-db:v1")
        queryClient.invalidateQueries({ queryKey: ["database"] })
    }
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [queryClient])
  const logout = () => {
    localStorage.removeItem("tmc-access-session:v1")
    setSession("")
    queryClient.invalidateQueries({ queryKey: ["database"] })
  }
  const account = db?.accounts.find((a) => a.id === session)
  useEffect(() => {
    if (
      db &&
      session &&
      (!account ||
        db.employees.find((e) => e.id === account.employeeId)?.status ===
          "inactive")
    )
      logout()
  }, [db, session, account])
  if (error)
    return (
      <div className="app-loading">
        <div className="text-title">Không thể tải dữ liệu demo</div>
        <div className="text-label-sm text-text-secondary">{error.message}</div>
        <Button onClick={() => refetch()}>Thử lại</Button>
      </div>
    )
  if (!db)
    return (
      <div className="app-loading">
        <div className="brand-mark">T</div>
        <div className="text-label text-text-secondary">
          Đang chuẩn bị không gian làm việc…
        </div>
        <div className="loading-line" />
      </div>
    )
  const run = async (
    task: () => Promise<unknown>,
    message = "Đã lưu thay đổi",
  ) => {
    setPending((p) => p + 1)
    try {
      await task()
      await queryClient.invalidateQueries({ queryKey: ["database"] })
      if (message) notify(message)
      return true
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Không thể lưu. Vui lòng thử lại.",
        true,
      )
      return false
    } finally {
      setPending((p) => p - 1)
    }
  }
  return (
    <Context.Provider
      value={{
        db,
        account,
        busy: pending > 0,
        run,
        notify,
        logout,
        login: (id) => {
          localStorage.setItem("tmc-access-session:v1", id)
          setSession(id)
        },
      }}
    >
      {children}
      {toast && (
        <div className="toast-host" role="status">
          <Toast
            message={toast.message}
            variant={toast.error ? "error" : "success"}
            progress={100}
            showCancel={false}
            onDismiss={() => setToast(null)}
          />
        </div>
      )}
    </Context.Provider>
  )
}
export function useApp() {
  const context = useContext(Context)
  if (!context) throw new Error("Thiếu AppProvider")
  return context
}
export function useAccount() {
  const { account } = useApp()
  if (!account) throw new Error("Phiên đăng nhập không hợp lệ")
  return account
}
