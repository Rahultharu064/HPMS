export function exportToCsv(filename, rows) {
  if (!rows || rows.length === 0) {
    console.warn('No data to export')
    return
  }
  const header = Object.keys(rows[0])
  const escape = (val) => {
    if (val === null || val === undefined) return ''
    const s = String(val)
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
    return s
  }
  const csv = [header.join(',')]
  for (const row of rows) {
    csv.push(header.map(k => escape(row[k])).join(','))
  }
  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
