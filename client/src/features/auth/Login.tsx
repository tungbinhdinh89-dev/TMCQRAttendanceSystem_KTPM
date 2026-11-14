import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Button, InputField } from "@figma/astraui"
import { useApp } from "../../app/context"
import { Brand, Card, ErrorText, Title } from "../../components/ui"
import { ThemeToggle } from "../../components/layout"
import { homeFor } from "../../lib/rbac"
export default function Login() {
 const { login, account } = useApp()
 const navigate = useNavigate()
 const [username, setUsername] = useState("")
 const [password, setPassword] = useState("")
 const [error, setError] = useState("")
 const [pending, setPending] = useState(false)
 if (account) return <Navigate to={homeFor(account.role)} replace />
 return <div className="app-loading"><div className="flex items-center gap-xl"><Brand /><ThemeToggle /></div>
 <Card className="auth-card"><Title>Đăng nhập TMC Access</Title>
 <p className="text-label-sm text-text-secondary mt-lg mb-xl">Dùng tài khoản đã được cấp. Quyền truy cập được xác định trên máy chủ.</p>
 <form onSubmit={async event => {
  event.preventDefault(); if (pending) return; setPending(true); setError("")
  try { const next = await login(username, password); setPassword(""); navigate(homeFor(next.role), { replace: true }) }
  catch (error) { setError(error instanceof Error ? error.message : "Không thể đăng nhập.") }
  finally { setPending(false) }
 }} className="flex flex-col gap-xl">
 <InputField label="Tên đăng nhập" value={username} onChange={setUsername} autoComplete="username" />
 <InputField label="Mật khẩu" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
 <ErrorText>{error}</ErrorText><Button type="submit" disabled={pending || !username.trim() || !password}>{pending ? "Đang đăng nhập…" : "Đăng nhập"}</Button>
 </form></Card></div>
}
