import { Navigate } from "react-router-dom"

/** The personnel route uses the real scoped API, not the legacy demo dataset. */
export default function Employees() { return <Navigate to="/management?tab=employees" replace /> }
