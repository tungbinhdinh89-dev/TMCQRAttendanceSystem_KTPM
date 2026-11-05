import { Button, Badge, Avatar } from "@figma/astraui"
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  QrCode,
  BarChart3,
  Check,
  MapPin,
  ScanLine,
  Users,
  Building2,
  ChevronRight,
} from "lucide-react"
import QRCode from "react-qr-code"
import { useNavigate } from "react-router-dom"
import { Brand, Title } from "../../components/ui"
import { PublicShell, ThemeToggle } from "../../components/layout"
import { useApp } from "../../app/context"
import { homeFor } from "../../lib/rbac"
const photo = `${import.meta.env.BASE_URL}images/tmc-factory.jpg`
export default function Landing() {
  const navigate = useNavigate(),
    { account } = useApp()
  const scroll = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  return (
    <PublicShell>
      <header className="landing-header">
        <Brand />
        <nav className="landing-nav">
          <Button variant="subtle" onClick={() => scroll("giai-phap")}>
            Giải pháp
          </Button>
          <Button variant="subtle" onClick={() => scroll("quy-trinh")}>
            Cách hoạt động
          </Button>
          <Button variant="subtle" onClick={() => scroll("nha-may")}>
            Nhà máy
          </Button>
        </nav>
        <div className="flex items-center gap-md">
          <span className="landing-theme">
            <ThemeToggle />
          </span>
          <Button
            variant="neutral"
            iconEnd={<ArrowUpRight size={16} />}
            onClick={() =>
              navigate(account ? homeFor(account.role) : "/dang-nhap")
            }
          >
            {account ? "Không gian của tôi" : "Đăng nhập"}
          </Button>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              NỀN TẢNG VẬN HÀNH TMC MANUFACTURING
            </div>
            <div role="heading" aria-level={1} className="hero-title">
              Ra vào liền mạch.
              <br />
              <span>Vận hành an tâm.</span>
            </div>
            <div className="hero-description">
              Một mã QR. Kết nối mọi điểm chạm.
              <br />
              Chấm công và kiểm soát ra vào thông minh, để mỗi ngày làm việc bắt
              đầu thật nhẹ nhàng.
            </div>
            <div className="hero-actions">
              <Button
                variant="primary"
                iconEnd={<ArrowRight size={16} />}
                onClick={() =>
                  navigate(account ? homeFor(account.role) : "/dang-nhap")
                }
              >
                Vào không gian làm việc
              </Button>
              <Button
                variant="subtle"
                iconStart={<ScanLine size={16} />}
                onClick={() => navigate("/kiosk")}
              >
                Trải nghiệm quét QR
              </Button>
            </div>
            <div className="hero-assurance">
              <div className="assurance-avatars">
                <Avatar type="initial" initials="MA" size="small" />
                <Avatar type="initial" initials="HN" size="small" />
                <Avatar type="initial" initials="TH" size="small" />
              </div>
              <div className="text-video-title text-text-secondary">
                <span className="font-semibold text-text-primary">
                  1.400 đồng nghiệp
                </span>{" "}
                · Cùng một kết nối
              </div>
            </div>
            <div className="hero-security">
              <ShieldCheck size={16} />
              <span>Dữ liệu tập trung</span>
              <span className="tiny-dot" />
              <span>Truy cập đúng quyền</span>
              <span className="tiny-dot" />
              <span>Sẵn sàng mỗi ca làm</span>
            </div>
          </div>
          <div className="hero-visual">
            <img
              src={photo}
              alt="Nhân viên đang vận hành máy móc trong nhà máy"
              className="hero-photo"
              fetchPriority="high"
            />
            <div className="photo-gradient" />
            <div className="photo-top">
              <span className="photo-label">
                <span className="live-dot" />
                KẾT NỐI THEO THỜI GIAN THỰC
              </span>
              <div className="photo-mark">
                <ShieldCheck size={24} />
              </div>
            </div>
            <div className="scan-card">
              <div className="flex items-center gap-lg">
                <div className="scan-avatar">
                  <Users size={24} />
                </div>
                <div>
                  <div className="text-label font-semibold">
                    Nguyễn Minh Anh
                  </div>
                  <div className="text-video-title text-text-secondary mt-xs">
                    TMC0001 · Bộ phận Sản xuất
                  </div>
                </div>
                <div className="scan-card-check">
                  <Check size={16} />
                </div>
              </div>
              <div className="scan-card-middle">
                <div className="mini-qr">
                  <QRCode value="TMC-ACCESS-PREVIEW" size={80} />
                </div>
                <div>
                  <div className="text-video-title text-text-secondary">
                    TRẠNG THÁI XÁC THỰC
                  </div>
                  <div className="text-label font-semibold mt-xs">
                    Chào ngày làm việc mới!
                  </div>
                  <div className="text-video-title text-text-secondary mt-md">
                    07:24:08 · Cổng chính Bình Dương
                  </div>
                </div>
              </div>
              <div className="scan-success">
                <span className="success-dot" />
                <span>Điểm danh thành công</span>
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="photo-caption">
              <MapPin size={16} />
              <span>Con người là trung tâm của mọi vận hành.</span>
            </div>
            <div className="visual-index">
              <span>01</span>
              <div />
              <span>02</span>
            </div>
          </div>
        </section>
        <section className="landing-metrics">
          <div className="metrics-intro">
            <span className="text-video-title text-text-secondary uppercase tracking-wider">
              MỘT HỆ THỐNG, MỌI KẾT NỐI
            </span>
            <div className="text-label mt-md">
              Đồng hành cùng
              <br />
              <span className="font-semibold">TMC Manufacturing</span>
            </div>
          </div>
          {[
            ["1.400", "Nhân viên được kết nối", Users],
            ["02", "Nhà máy cùng vận hành", Building2],
            ["< 2 giây", "Cho mỗi lượt xác thực", QrCode],
            ["24/7", "An tâm kiểm soát", ShieldCheck],
          ].map(([value, label, Icon]) => {
            const I = Icon as typeof Users
            return (
              <div className="landing-metric" key={String(label)}>
                <div className="metric-top">
                  <span className="metric-number">{String(value)}</span>
                  <I size={20} className="text-text-secondary" />
                </div>
                <span className="text-label-sm text-text-secondary">
                  {String(label)}
                </span>
              </div>
            )
          })}
        </section>
        <section className="landing-section" id="giai-phap">
          <div className="section-heading">
            <div>
              <div className="eyebrow">ĐƠN GIẢN HÓA MỖI NGÀY</div>
              <Title level={2} className="marketing-heading">
                Ít thao tác hơn.
                <br />
                Nhiều kết nối hơn.
              </Title>
            </div>
            <div className="text-label-sm text-text-secondary section-intro">
              Từ cổng nhà máy đến bàn làm việc của nhân sự.
              <br />
              Mọi dữ liệu liền mạch trong một nền tảng.
            </div>
          </div>
          <div className="feature-grid">
            {[
              {
                icon: QrCode,
                index: "01",
                title: "Một mã QR, sẵn sàng vào ca",
                description:
                  "Không thẻ từ, không chờ đợi. Mã QR cá nhân cập nhật liên tục, giúp mỗi lượt ra vào nhanh và thuận tiện.",
                label: "Dành cho nhân viên",
              },
              {
                icon: ShieldCheck,
                index: "02",
                title: "Đúng người. Đúng quyền.",
                description:
                  "Xác thực ngay tại cổng, nhận diện bất thường và quản lý luồng ra vào tại từng nhà máy.",
                label: "Dành cho an ninh",
              },
              {
                icon: BarChart3,
                index: "03",
                title: "Dữ liệu rõ ràng, quyết định dễ dàng",
                description:
                  "Chấm công, theo dõi ca làm và tổng hợp báo cáo. Một nguồn dữ liệu, một góc nhìn toàn diện.",
                label: "Dành cho quản lý",
              },
            ].map((f) => (
              <div className="feature-card" key={f.index}>
                <div className="flex justify-between items-center">
                  <div className="feature-icon">
                    <f.icon size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-video-title text-text-secondary">
                    {f.index} /
                  </span>
                </div>
                <Title level={3} className="mt-2xl">
                  {f.title}
                </Title>
                <div className="text-label-sm text-text-secondary mt-lg">
                  {f.description}
                </div>
                <div className="feature-card-footer">
                  <span className="text-video-title">{f.label}</span>
                  <ArrowUpRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="workflow-section" id="quy-trinh">
          <div className="section-heading">
            <div>
              <div className="eyebrow">TỪ KẾT NỐI ĐẾN HIỆU QUẢ</div>
              <Title level={2} className="marketing-heading">
                Gọn trong một luồng vận hành.
              </Title>
            </div>
            <Button
              variant="neutral"
              iconEnd={<ArrowRight size={16} />}
              onClick={() => navigate("/dang-nhap?role=employee")}
            >
              Khám phá ứng dụng nhân viên
            </Button>
          </div>
          <div className="workflow-grid">
            {[
              ["01", "Mở mã QR", "Mã cá nhân luôn sẵn sàng trên điện thoại."],
              [
                "02",
                "Quét tại cổng",
                "Xác thực nhanh tại cổng nhà máy được phép.",
              ],
              [
                "03",
                "Tự động chấm công",
                "Giờ vào, giờ ra được ghi nhận chính xác.",
              ],
              [
                "04",
                "Theo dõi tập trung",
                "Dữ liệu đồng bộ cho nhân viên và quản lý.",
              ],
            ].map(([n, title, text]) => (
              <div key={n} className="workflow-step">
                <div className="step-number">
                  {n}
                  <ChevronRight size={16} />
                </div>
                <Title level={3}>{title}</Title>
                <div className="text-label-sm text-text-secondary mt-md">
                  {text}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="landing-section" id="nha-may">
          <div className="section-heading">
            <div>
              <div className="eyebrow">CHUNG MỘT TIÊU CHUẨN</div>
              <Title level={2} className="marketing-heading">
                Hai nhà máy. Một nhịp kết nối.
              </Title>
            </div>
            <Badge label="Hệ thống demo đang sẵn sàng" variant="success" />
          </div>
          <div className="sites-grid">
            {[
              {
                name: "Bình Dương",
                code: "BD",
                info: "Khu công nghiệp VSIP · Trung tâm sản xuất",
                total: "860",
              },
              {
                name: "Long An",
                code: "LA",
                info: "Khu công nghiệp Long Hậu · Sản xuất & kho vận",
                total: "540",
              },
            ].map((s) => (
              <div className="site-card" key={s.code}>
                <div className="site-code">
                  {s.code}
                  <ArrowUpRight size={24} />
                </div>
                <div className="site-details">
                  <Title level={2}>Nhà máy {s.name}</Title>
                  <div className="text-label-sm text-text-secondary mt-md">
                    {s.info}
                  </div>
                  <div className="flex items-center gap-xl mt-2xl">
                    <span className="text-video-title flex items-center gap-xs">
                      <Users size={16} />
                      {s.total} nhân viên
                    </span>
                    <span className="text-video-title flex items-center gap-xs">
                      <ScanLine size={16} />2 cổng kiểm soát
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="landing-cta">
          <div className="cta-icon">
            <QrCode size={32} />
          </div>
          <div>
            <Title level={2} className="marketing-heading">
              Sẵn sàng cho một ngày liền mạch?
            </Title>
            <div className="text-label-sm text-text-secondary mt-md">
              Không gian làm việc của bạn, chỉ cách một lần đăng nhập.
            </div>
          </div>
          <Button
            variant="primary"
            iconEnd={<ArrowRight size={16} />}
            onClick={() => navigate("/dang-nhap")}
          >
            Bắt đầu ngay
          </Button>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <div className="text-video-title text-text-secondary">
          © {new Date().getFullYear()} TMC Manufacturing. Cùng nhau vận hành tốt
          hơn.
          <br />
          <span className="photo-credit">
            Ảnh minh họa: Sam Moghadam / Unsplash · Phiên bản demo, không phải
            hệ thống bảo mật thực.
          </span>
        </div>
        <span className="text-video-title text-text-secondary flex items-center gap-xs">
          <ShieldCheck size={16} />
          TMC Access v1.0
        </span>
      </footer>
    </PublicShell>
  )
}
