export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines[0].split(",")
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values = []
    let cur = ""
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const ch = line[j]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === "," && !inQuotes) {
        values.push(cur)
        cur = ""
      } else {
        cur += ch
      }
    }
    values.push(cur)

    const row = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx]
    })
    rows.push(row)
  }

  return rows.map((r) => ({
    id: r.school_id,
    name: r.school_name,
    state: r.state,
    district: r.district,
    enrollment: Number(r.enrollment),
    reading: Number(r.reading_pct_std3),
    arithmetic: Number(r.arithmetic_pct_std3),
    girlsDropoutRisk: Number(r.girls_dropout_risk_pct),
    hasLibrary: r.has_library === "True",
    libraryUsed: r.library_used === "True",
    hasComputer: r.has_computer === "True",
    computerUsed: r.computer_used === "True",
    yearsFlagged: Number(r.years_flagged_no_improvement),
    interventionRecorded: r.intervention_recorded === "True",
  }))
}