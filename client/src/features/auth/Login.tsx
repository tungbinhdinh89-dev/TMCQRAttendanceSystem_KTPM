import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button, InputField } from "@figma/astraui"
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
} from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Brand, ErrorText, Title } from "../../components/ui"
import { PublicShell, ThemeToggle } from "../../components/layout"
import { useApp } from "../../app/context"
import { hasAccess, homeFor, roleLabels } from "../../lib/rbac"
const schema = z.object({
  username: z.string().min(1, "Vui lòng nhập tài khoản"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
})
export default function Login() {
  const { db, login, account } = useApp(),
    navigate = useNavigate(),
    [search] = useSearchParams()
  const [error, setError] = useState(""),
    [show, setShow] = useState(false)
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: search.get("username") || (search.get("role") === "employee" ? "emp.demo" : "adm.demo"),
      password: "",
    },
  })
  const selected = form.watch("username")
  const submit = form.handleSubmit(async (values) => {
    setError("")
    let user
    try {
      user = await login(values.username, values.password)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không thể kết nối máy chủ đăng nhập.")
      return
    }
    const returnTo = search.get("returnTo")
    const module = returnTo?.startsWith("/app/")
      ? returnTo.split("/")[2]
      : returnTo?.startsWith("/mobile/")
        ? "mobile"
        : returnTo === "/kiosk"
          ? "kiosk"
          : ""
    navigate(
      returnTo && module && hasAccess(user.role, module)
        ? returnTo
        : homeFor(user.role),
    )
  })
  return (
    <PublicShell>
      <div className="login-page">
        <header className="login-header">
          <Brand />
          <ThemeToggle />
        </header>
        <div className="login-grid">
          <div className="login-story">
            <div className="eyebrow">CHÀO MỪNG TRỞ LẠI</div>
            <div className="hero-title" role="heading" aria-level={1}>
              Một kết nối.
              <br />
              <span>Mọi người cùng tiến.</span>
            </div>
            <div className="hero-description">
              Mỗi ca làm đều bắt đầu bằng sự an tâm.
              <br />
              Đăng nhập để kết nối với không gian TMC của bạn.
            </div>
            <div className="login-story-card">
              <ShieldCheck size={32} className="text-brand-primary" />
              <Title level={3}>Đúng vai trò. Đúng không gian.</Title>
              <div className="text-label-sm text-text-secondary">
                Từ nhân viên tại nhà máy đến đội ngũ quản lý — mọi trải nghiệm
                được thiết kế dành riêng cho bạn.
              </div>
              <div className="flex items-center gap-md text-video-title">
                <span className="live-dot" />
                Hai nhà máy · Một nền tảng
              </div>
            </div>
            <Button
              variant="subtle"
              iconStart={<ArrowLeft size={16} />}
              onClick={() => navigate("/")}
            >
              Về trang chủ
            </Button>
          </div>
          <div className="login-form-card">
            <div className="text-video-title text-brand-primary mb-lg">
              KHÔNG GIAN DOANH NGHIỆP
            </div>
            <Title>Đăng nhập TMC Access</Title>
            <div className="text-label-sm text-text-secondary mt-md mb-2xl">
              Sử dụng tài khoản do công ty cung cấp.
            </div>
            <form onSubmit={submit} className="flex flex-col gap-lg">
              <Controller
                control={form.control}
                name="username"
                render={({ field }) => (
                  <InputField
                    label="Tài khoản"
                    placeholder="Nhập tên tài khoản"
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v)
                      setError("")
                    }}
                    prefix={<User size={16} />}
                    autoComplete="username"
                  />
                )}
              />
              <ErrorText>{form.formState.errors.username?.message}</ErrorText>
              <Controller
                control={form.control}
                name="password"
                render={({ field }) => (
                  <InputField
                    label="Mật khẩu"
                    type={show ? "text" : "password"}
                    value={field.value}
                    onChange={field.onChange}
                    prefix={<Lock size={16} />}
                    autoComplete="current-password"
                    suffix={
                      <Button
                        type="button"
                        variant="subtle"
                        size="small"
                        aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        onClick={() => setShow(!show)}
                      >
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    }
                  />
                )}
              />
              <ErrorText>{form.formState.errors.password?.message}</ErrorText>
              <div className="text-video-title text-text-secondary">
                Mật khẩu được xác thực trên máy chủ; phiên dùng cookie HttpOnly.
              </div>
              <ErrorText>{error}</ErrorText>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                variant="primary"
                iconEnd={<ArrowRight size={16} />}
              >
                {form.formState.isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
              </Button>
            </form>
            <div className="demo-divider">
              <span>KHÁM PHÁ VỚI TÀI KHOẢN DEMO</span>
            </div>
            <div className="demo-account-grid">
              {db.accounts.map((a) => (
                <Button
                  key={a.id}
                  variant="neutral"
                  className={`demo-account ${
                    selected === a.username ? "selected" : ""
                  }`}
                  onClick={() => {
                    form.setValue("username", a.username)
                    form.setValue("password", "")
                    setError("")
                  }}
                >
                  <span>
                    <span className="block text-label-sm">
                      {roleLabels[a.role]}
                    </span>
                    <span className="block text-video-title text-text-secondary">
                      {a.username} · {a.name}
                    </span>
                  </span>
                  {selected === a.username && <ShieldCheck size={16} />}
                </Button>
              ))}
            </div>
            <div className="demo-note">
              <Lock size={16} />
              <span>
                Chọn tài khoản seed và nhập mật khẩu demo trong README. Quyền và trạng thái tài khoản được đọc từ PostgreSQL.
              </span>
            </div>
            {account && (
              <Button
                variant="subtle"
                size="small"
                onClick={() => navigate(homeFor(account.role))}
              >
                Tiếp tục phiên của {account.name}
              </Button>
            )}
          </div>
        </div>
        <footer className="login-footer text-video-title text-text-secondary">
          © {new Date().getFullYear()} TMC Manufacturing · Kết nối con người, an
          tâm vận hành.
        </footer>
      </div>
    </PublicShell>
  )
}
