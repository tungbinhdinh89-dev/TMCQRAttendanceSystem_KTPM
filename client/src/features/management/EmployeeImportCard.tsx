import { useState } from "react"
import { Alert, Button } from "@mui/material"
import { Card } from "../../components/ui"
import { managementRequest as request, type Organization } from "../../data/management"
import { employeeCsvTemplate, parseEmployeeCsv } from "./employee-csv"

export default function EmployeeImportCard({ org, onImported }: { org: Organization; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState("")
  function template() {
    const url = URL.createObjectURL(new Blob(["\uFEFF", employeeCsvTemplate], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a"); a.href = url; a.download = "employee-import-template.csv"; a.click(); URL.revokeObjectURL(url)
  }
  async function upload() {
    if (!file) return
    setBusy(true); setError(""); setResult("")
    try {
      if (file.size > 2_000_000) throw new Error("CSV tối đa 2 MB.")
      const rows = parseEmployeeCsv(await file.text(), org)
      const response = await request<{ imported: number }>("/employees/import", "POST", { rows })
      setResult(`Máy chủ đã nhập ${response.imported} hồ sơ. Có thể kiểm tra lại tại tab Nhân viên.`); onImported()
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể nhập file.") }
    finally { setBusy(false) }
  }
  return <Card><h2>Nhập nhân viên từ HRS bằng CSV</h2>
    <p>Xuất Excel thành CSV UTF-8, tối đa 2 MB / 2.000 dòng. Mã HRS nhập từ hệ thống gốc; để trống employeeCode để máy chủ cấp mã nội bộ. Toàn bộ file được kiểm tra và lưu trong một transaction; có lỗi thì không nhập một phần.</p>
    <p>Cột mã nhà máy/phòng ban/tổ dùng mã có sẵn trong Tổ chức, không dùng tên hiển thị. Không tự tạo tổ chức hoặc đồng bộ API HRS trong thao tác này.</p>
    {error && <Alert severity="error" role="alert">{error}</Alert>}{result && <Alert severity="success" role="status">{result}</Alert>}
    <div className="management-actions"><Button disabled={busy} onClick={template}>Tải CSV mẫu</Button>
      <label htmlFor="employee-csv">Chọn CSV UTF-8</label><input id="employee-csv" type="file" accept=".csv,text/csv" disabled={busy} onChange={e => { setFile(e.target.files?.[0] ?? null); setError(""); setResult("") }} />
      <Button variant="contained" disabled={busy || !file || !org.factories.length} onClick={upload}>{busy ? "Đang nhập…" : "Kiểm tra và nhập CSV"}</Button></div>
  </Card>
}
