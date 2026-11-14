import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Toast, Button } from "@figma/astraui"
import { api, emptyDatabase } from "../data/api"
import { authApi } from "../data/auth"
import { accountFromSession } from "../lib/session"
import type { Account, Database } from "../data/types"
interface AppState {
 db: Database; account?: Account; busy: boolean
 login: (username: string, password: string) => Promise<Account>
 logout: () => Promise<boolean>
 notify: (message: string, error?: boolean) => void
 run: (task: () => Promise<unknown>, message?: string) => Promise<boolean>
}
const Context = createContext<AppState | null>(null)
export default function AppProvider({ children }: { children: ReactNode }) {
 const queryClient = useQueryClient()
 const session = useQuery({ queryKey: ["session"], queryFn: authApi.me, retry: false, staleTime: 0 })
 const sessionChannel = useRef<BroadcastChannel | null>(null)
 const identity = session.data
 const workspace = useQuery({ queryKey: ["database", identity?.userId], queryFn: api.getDatabase, enabled: !!identity, retry: false })
 const db = workspace.data ?? emptyDatabase()
 const account = identity ? accountFromSession(identity, db) : undefined
 const [pending, setPending] = useState(0)
 const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null)
 const notify = (message: string, error = false) => setToast({ message, error })
 useEffect(() => {
  for (const key of ["tmc-access-db:v1", "tmc-access-session:v1"]) localStorage.removeItem(key)
  const channel = new BroadcastChannel("tmc-session")
  sessionChannel.current = channel
  channel.onmessage = () => { queryClient.setQueryData(["session"], null); queryClient.removeQueries({ queryKey: ["database"] }); void queryClient.invalidateQueries({ queryKey: ["session"] }) }
  return () => { channel.close(); sessionChannel.current = null }
 }, [queryClient])
 useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 4500); return () => clearTimeout(timer) }, [toast])
 const broadcast = () => sessionChannel.current?.postMessage("changed")
 const logout = async () => {
  try { await authApi.logout(); await queryClient.cancelQueries(); queryClient.removeQueries({ queryKey: ["database"] }); queryClient.setQueryData(["session"], null); broadcast(); return true }
  catch { notify("Không thể đăng xuất trên máy chủ. Vui lòng thử lại.", true); return false }
 }
 const error = session.error ?? workspace.error
 if (error) return <div className="app-loading"><h1>Không thể kết nối máy chủ</h1><p>{error.message}</p><Button onClick={() => { void session.refetch(); if (identity) void workspace.refetch() }}>Thử lại</Button>{identity && <Button onClick={logout}>Đăng xuất</Button>}</div>
 if (session.isPending || (identity && workspace.isPending)) return <div className="app-loading" role="status">Đang tải phiên và dữ liệu từ máy chủ…</div>
 return <Context.Provider value={{ db, account, busy: pending > 0, notify, logout,
  login: async (username, password) => {
   const next = await authApi.login(username, password)
   const nextAccount = accountFromSession(next, emptyDatabase())
   if (!nextAccount) { await authApi.logout(); throw new Error("Tài khoản chưa có vai trò ứng dụng hợp lệ.") }
   await queryClient.cancelQueries(); queryClient.removeQueries({ queryKey: ["database"] }); queryClient.setQueryData(["session"], next); broadcast(); return nextAccount
  },
  run: async (task, message = "Đã lưu thay đổi") => {
   setPending(value => value + 1)
   try { await task(); await queryClient.invalidateQueries({ queryKey: ["database"] }); if (message) notify(message); return true }
   catch (error) { notify(error instanceof Error ? error.message : "Không thể lưu thay đổi.", true); return false }
   finally { setPending(value => value - 1) }
  },
 }}>{children}{toast && <div className="toast-host" role="status"><Toast message={toast.message} variant={toast.error ? "error" : "success"} progress={100} showCancel={false} onDismiss={() => setToast(null)} /></div>}</Context.Provider>
}
export function useApp() { const context = useContext(Context); if (!context) throw new Error("Thiếu AppProvider"); return context }
export function useAccount() { const { account } = useApp(); if (!account) throw new Error("Phiên đăng nhập không hợp lệ"); return account }
