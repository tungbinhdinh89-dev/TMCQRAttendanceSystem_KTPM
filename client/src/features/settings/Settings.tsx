import { useApp, useAccount } from "../../app/context"
import { Card, PageHeader, InfoRow } from "../../components/ui"
import { roleLabels } from "../../lib/rbac"
export default function Settings() {
 const { db } = useApp(), account = useAccount()
 return <><PageHeader title="Cài đặt hệ thống" description="Thông tin phiên đăng nhập và dữ liệu từ máy chủ." />
 <Card><InfoRow label="Tài khoản">{account.username}</InfoRow><InfoRow label="Vai trò">{roleLabels[account.role]}</InfoRow><InfoRow label="Phạm vi">{account.scopeType}</InfoRow><InfoRow label="Trạm đã cấu hình">{db.gates.length}</InfoRow><p className="text-label-sm mt-xl">Quyền được kiểm tra trên máy chủ. Thay đổi tài khoản cần đăng xuất và đăng nhập lại; không có chức năng chuyển vai trò trong trình duyệt.</p></Card></>
}
