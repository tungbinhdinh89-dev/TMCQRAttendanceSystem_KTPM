export function exportCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const escape = (value: string | number) => {
    let str = String(value)
    if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`
    return `"${str.replace(/"/g, '""')}"`
  }
  const blob = new Blob(
    [
      "\uFEFF" +
        [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  )
  const url = URL.createObjectURL(blob),
    link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
