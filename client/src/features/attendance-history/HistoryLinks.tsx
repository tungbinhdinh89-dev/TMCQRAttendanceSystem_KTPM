import { Link } from "react-router-dom"
import { canReadAttendance, canReadGateHistory, canReadAttendanceSummary, type AccessIdentity } from "../../lib/server-access"

export default function HistoryLinks({ identity }: { identity: AccessIdentity }) {
  return <>{canReadAttendance(identity) && <Link to="/attendance">Lịch sử chấm công</Link>}{canReadGateHistory(identity) && <Link to="/gate-history">Nhật ký cổng</Link>}{canReadAttendanceSummary(identity) && <Link to="/attendance-summary">Tổng hợp chấm công</Link>}</>
}
