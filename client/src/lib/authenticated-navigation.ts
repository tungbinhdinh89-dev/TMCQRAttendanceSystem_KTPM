import { createContext, useContext, useEffect, useRef } from "react"

export type NavigationGuard = () => boolean
export const AuthenticatedNavigation = createContext<((guard: NavigationGuard) => () => void) | null>(null)

/** Preserve feature-specific pending work when navigating through the shared sidebar. */
export function useAuthenticatedNavigationGuard(guard: NavigationGuard) {
  const register = useContext(AuthenticatedNavigation)
  const current = useRef(guard)
  current.current = guard
  useEffect(() => register?.(() => current.current()), [register])
}
