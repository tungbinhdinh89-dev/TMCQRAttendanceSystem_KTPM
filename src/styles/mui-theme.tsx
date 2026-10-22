import { useEffect, useMemo, useState, type ReactNode } from "react"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { useTheme } from "@figma/astraui"
export default function MuiBridge({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setRevision((r) => r + 1))
    return () => cancelAnimationFrame(frame)
  }, [theme])
  const mui = useMemo(() => {
    const css = getComputedStyle(document.documentElement)
    const token = (name: string) => css.getPropertyValue(name).trim()
    return createTheme({
      palette: {
        mode: theme,
        primary: { main: token("--brand-primary") },
        background: {
          default: token("--brand-tertiary"),
          paper: token("--surface-bg"),
        },
        text: {
          primary: token("--text-primary"),
          secondary: token("--text-secondary"),
        },
      },
      typography: { fontFamily: "Instrument Sans, system-ui, sans-serif" },
      components: {
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderColor: "var(--border-secondary)",
              padding: "var(--space-xl)",
              color: "var(--text-primary)",
              fontSize: "calc(var(--font-size) * .875)",
            },
            head: {
              background: "var(--bg-faint)",
              color: "var(--text-secondary)",
              fontWeight: 500,
              whiteSpace: "nowrap",
            },
          },
        },
        MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: "var(--corner-md)",
              background: "var(--input-bg)",
              fontSize: "calc(var(--font-size) * .875)",
            },
          },
        },
        MuiInputLabel: { styleOverrides: { root: { fontFamily: "inherit" } } },
      },
    })
  }, [theme, revision])
  return <ThemeProvider theme={mui}>{children}</ThemeProvider>
}
