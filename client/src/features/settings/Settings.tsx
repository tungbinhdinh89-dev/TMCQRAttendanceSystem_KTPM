import { useState } from "react"
import {
  Button,
  Modal,
  SelectField,
  SecondaryNav,
  SecondaryNavItem,
  SwitchField,
  Badge,
} from "@figma/astraui"
import {
  Settings as SettingsIcon,
  ScanLine,
  Users,
  RotateCcw,
  Database as DatabaseIcon,
  ShieldCheck,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTheme } from "@figma/astraui"
import { useApp } from "../../app/context"
import { Card, PageHeader, Title, InfoRow, Person } from "../../components/ui"
import { api } from "../../data/api"
import { sites } from "../../data/types"
import { roleLabels } from "../../lib/rbac"
export default function Settings() {
  const { db, run, busy } = useApp(),
    navigate = useNavigate(),
    { theme, setTheme } = useTheme()
  const [section, setSection] = useState("general"),
    [reset, setReset] = useState(false)
  return (
    <>
      <PageHeader
        title="Cài đặt hệ thống"
        description="Thiết lập một không gian làm việc phù hợp với đội ngũ của bạn."
      />
      <div className="settings-layout">
        <SecondaryNav title="Thiết lập" className="settings-nav">
          {[
            { id: "general", label: "Hệ thống", icon: SettingsIcon },
            { id: "gates", label: "Cổng & thiết bị", icon: ScanLine },
            { id: "accounts", label: "Tài khoản demo", icon: Users },
            { id: "data", label: "Dữ liệu demo", icon: DatabaseIcon },
          ].map((s) => (
            <SecondaryNavItem
              key={s.id}
              label={s.label}
              icon={<s.icon className="size-full" strokeWidth={1.5} />}
              active={section === s.id}
              onClick={() => setSection(s.id)}
            />
          ))}
        </SecondaryNav>
        <div className="settings-content">
          {section === "general" && (
            <Card>
              <Title level={3} className="mb-xl">
                Thông tin hệ thống
              </Title>
              <InfoRow label="Tên công ty">TMC Manufacturing</InfoRow>
              <InfoRow label="Hệ thống">TMC Access · Phiên bản 1.0</InfoRow>
              <InfoRow label="Nhà máy">Bình Dương & Long An</InfoRow>
              <InfoRow label="Múi giờ">Việt Nam (UTC+07:00)</InfoRow>
              <InfoRow label="Thời hạn QR">60 giây</InfoRow>
              <InfoRow label="Chặn quét lặp">30 giây</InfoRow>
              <div className="mt-2xl">
                <SelectField
                  label="Giao diện"
                  value={theme}
                  onChange={(v) => setTheme(v as "light" | "dark")}
                  options={[
                    { value: "light", label: "Sáng" },
                    { value: "dark", label: "Tối" },
                  ]}
                />
              </div>
              <div className="operating-note mt-2xl">
                <ShieldCheck size={24} />
                <div className="text-label-sm">
                  Phân quyền được thực hiện trên frontend cho mục đích trình
                  diễn. Không sử dụng để kiểm soát truy cập thực tế.
                </div>
              </div>
            </Card>
          )}
          {section === "gates" && (
            <Card>
              <Title level={3} className="mb-xl">
                Kết nối thiết bị
              </Title>
              {db.gates.map((g) => (
                <div className="settings-gate" key={g.id}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-label-sm font-semibold">
                        {g.name}
                      </div>
                      <div className="text-video-title text-text-secondary mt-xs">
                        {sites[g.site]}
                      </div>
                    </div>
                    <Badge
                      label={g.online ? "Trực tuyến" : "Ngoại tuyến"}
                      variant={g.online ? "success" : "warning"}
                    />
                  </div>
                  <SwitchField
                    key={String(g.online)}
                    label="Cho phép hoạt động"
                    description="Trạng thái kết nối mô phỏng"
                    defaultSelected={g.online}
                    onChange={(v) =>
                      run(() => api.setGate(g.id, v), "Đã cập nhật thiết bị")
                    }
                  />
                </div>
              ))}
            </Card>
          )}
          {section === "accounts" && (
            <Card>
              <Title level={3}>Tài khoản trải nghiệm</Title>
              <div className="text-label-sm text-text-secondary mt-md mb-xl">
                Mở form đăng nhập để kiểm tra vai trò bằng tài khoản seed. Cần xác thực mật khẩu; không chuyển danh tính trực tiếp.
              </div>
              {db.accounts.map((a) => (
                <div className="account-setting-row" key={a.id}>
                  <Person
                    name={a.name}
                    code={`${a.username} · ${roleLabels[a.role]}`}
                  />
                  <Button
                    variant="neutral"
                    size="small"
                    onClick={() => {
                      navigate(`/dang-nhap?username=${encodeURIComponent(a.username)}`)
                    }}
                  >
                    Đăng nhập tài khoản
                  </Button>
                </div>
              ))}
            </Card>
          )}
          {section === "data" && (
            <Card>
              <Title level={3}>Dữ liệu trình diễn</Title>
              <div className="text-label-sm text-text-secondary mt-lg mb-xl">
                Mọi thay đổi chỉ được lưu trên trình duyệt hiện tại. Không có dữ
                liệu gửi đến máy chủ.
              </div>
              <InfoRow label="Hồ sơ nhân viên">{db.employees.length}</InfoRow>
              <InfoRow label="Bản ghi chấm công">
                {db.attendance.length}
              </InfoRow>
              <InfoRow label="Sự kiện ra vào">{db.events.length}</InfoRow>
              <InfoRow label="Đề nghị điều chỉnh">
                {db.adjustments.length}
              </InfoRow>
              <div className="reset-panel mt-2xl">
                <Title level={3}>Khôi phục trạng thái ban đầu</Title>
                <div className="text-label-sm text-text-secondary mt-md mb-xl">
                  Xóa các thay đổi trong demo và tạo lại dữ liệu mẫu. Tùy chọn
                  giao diện được giữ nguyên.
                </div>
                <Button
                  variant="neutral"
                  iconStart={<RotateCcw size={16} />}
                  onClick={() => setReset(true)}
                >
                  Đặt lại dữ liệu demo
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
      <Modal
        isOpen={reset}
        onClose={() => setReset(false)}
        title="Đặt lại toàn bộ dữ liệu demo?"
        footer={
          <>
            <Button variant="neutral" onClick={() => setReset(false)}>
              Hủy
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                if (await run(api.reset, "Đã khôi phục dữ liệu demo ban đầu"))
                  setReset(false)
              }}
            >
              Đặt lại dữ liệu
            </Button>
          </>
        }
      >
        <div className="text-label-sm text-text-secondary">
          Các hồ sơ, lượt quét và điều chỉnh bạn tạo sẽ bị xóa. Thao tác này
          không thể hoàn tác.
        </div>
      </Modal>
    </>
  )
}
