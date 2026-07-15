import { useState, useMemo, useEffect } from 'react'
import './App.css'
import schoolsCsv from './data/schools.csv?raw'
import { parseCSV } from './utils/parseCSV'
import { priorityScore, resourceGap } from './utils/priorityScore'


function App() {
  const schools = useMemo(() => parseCSV(schoolsCsv), [])

  const states = useMemo(
    () => ["All States", ...Array.from(new Set(schools.map((s) => s.state))).sort()],
    [schools]
  )

  const [stateFilter, setStateFilter] = useState("All States")
  const [subject, setSubject] = useState("reading")
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState("priority")
  const [priorityPage, setPriorityPage] = useState(0)
  const [utilizationPage, setUtilizationPage] = useState(0)

  const filtered = useMemo(
    () => schools.filter((s) => stateFilter === "All States" || s.state === stateFilter),
    [schools, stateFilter]
  )

  const priorityRanked = useMemo(
    () => [...filtered].sort((a, b) => priorityScore(b) - priorityScore(a)),
    [filtered]
  )

  const utilizationFlagged = useMemo(
    () => filtered.filter((s) => resourceGap(s) > 0).sort((a, b) => resourceGap(b) - resourceGap(a)),
    [filtered]
  )

  useEffect(() => {
    setPriorityPage(0)
    setUtilizationPage(0)
  }, [stateFilter])

  const pageSize = 40
  const totalPages = Math.ceil(priorityRanked.length / pageSize)
  const pagedSchools = priorityRanked.slice(priorityPage * pageSize, (priorityPage + 1) * pageSize)

  const utilPageSize = 40
  const utilTotalPages = Math.ceil(utilizationFlagged.length / utilPageSize)
  const pagedUtilization = utilizationFlagged.slice(utilizationPage * utilPageSize, (utilizationPage + 1) * utilPageSize)

  const stateUtilStats = useMemo(() => {
    const byState = {}
    filtered.forEach((s) => {
      if (!byState[s.state]) byState[s.state] = { libAvail: 0, libUsed: 0, compAvail: 0, compUsed: 0 }
      const b = byState[s.state]
      if (s.hasLibrary) b.libAvail += 1
      if (s.hasLibrary && s.libraryUsed) b.libUsed += 1
      if (s.hasComputer) b.compAvail += 1
      if (s.hasComputer && s.computerUsed) b.compUsed += 1
    })
    return byState
  }, [filtered])

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div>Flexera Project</div>
          <h1 style={{ fontSize: "28px" }}>District Learning & Resource Monitor</h1>
        </div>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="p-2"
        >
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "20px" }}>
        {[
          { key: "priority", label: "Priority Action Queue" },
          { key: "heatmap", label: "Subject Heat Map" },
          { key: "utilization", label: "Resource Utilization" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            style={{
              padding: "8px 16px",
              marginRight: "8px",
              background: view === t.key ? "#ddd" : "#f5f5f5",
              border: "1px solid #aaa",
              cursor: "pointer"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {view === "priority" && (
          <div>
            <div className="mb-4 p-3 rounded text-xs bg-gray-50 border border-gray-200 text-gray-600">
              Score = (reading gap below 30%) × 1.2 + (arithmetic gap below 30%) × 1.2 + (girls' dropout risk %) × 0.8 + (years flagged with no improvement × 4) + (8 if no intervention recorded). Higher score = higher priority.
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-3">Rank</th>
                  <th className="py-2 pr-3">School</th>
                  <th className="py-2 pr-3">District</th>
                  <th className="py-2 pr-3 text-right">Reading %</th>
                  <th className="py-2 pr-3 text-right">Arithmetic %</th>
                  <th className="py-2 pr-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {pagedSchools.map((s, idx) => (
                  <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => setSelected(s)}>
                    <td className="py-2 pr-3">{priorityPage * pageSize + idx + 1}</td>
                    <td className="py-2 pr-3 font-medium">{s.name}</td>
                    <td className="py-2 pr-3 text-gray-500">{s.district}, {s.state}</td>
                    <td className="py-2 pr-3 text-right">{s.reading.toFixed(1)}</td>
                    <td className="py-2 pr-3 text-right">{s.arithmetic.toFixed(1)}</td>
                    <td className="py-2 pr-3 text-right font-semibold">{priorityScore(s).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-3 text-sm">
              <span className="text-gray-500">
                Showing {priorityPage * pageSize + 1}-{Math.min((priorityPage + 1) * pageSize, priorityRanked.length)} of {priorityRanked.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPriorityPage((p) => Math.max(0, p - 1))}
                  disabled={priorityPage === 0}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPriorityPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={priorityPage >= totalPages - 1}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {view === "heatmap" && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-500">Subject:</span>
              {["reading", "arithmetic"].map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSubject(subj)}
                  className={`px-3 py-1.5 rounded text-sm font-medium capitalize ${
                    subject === subj ? "bg-slate-900 text-white" : "bg-gray-100 text-slate-900"
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(46px, 1fr))" }}>
              {filtered.map((s) => {
                const val = subject === "reading" ? s.reading : s.arithmetic
                const color = val < 20 ? "#B23A3A" : val < 27 ? "#C97B2E" : "#2E8B8B"
                return (
                  <div
                    key={s.id}
                    title={`${s.name} — ${val.toFixed(1)}%`}
                    onClick={() => setSelected(s)}
                    className="rounded flex items-center justify-center text-white text-xs cursor-pointer"
                    style={{ background: color, height: 42 }}
                  >
                    {val.toFixed(0)}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {view === "utilization" && (
          <div>
            <div className="mb-4 p-3 rounded text-xs bg-gray-50 border border-gray-200 text-gray-600">
              Flags schools where a library or computer is available but not observed in use on the day of visit — modeled on the pattern found in ASER 2024 (Table 28B): resources present, usage collapsing.
            </div>
            <div className="grid md:grid-cols-2 gap-3 mb-5">
              {Object.entries(stateUtilStats).map(([state, b]) => (
                <div key={state} className="p-3 rounded border border-gray-200">
                  <div className="font-medium text-sm mb-1">{state}</div>
                  <div className="text-xs flex justify-between text-gray-500">
                    <span>Library used (of available)</span>
                    <span>{b.libAvail ? Math.round((100 * b.libUsed) / b.libAvail) : 0}%</span>
                  </div>
                  <div className="text-xs flex justify-between text-gray-500">
                    <span>Computer used (of available)</span>
                    <span>{b.compAvail ? Math.round((100 * b.compUsed) / b.compAvail) : 0}%</span>
                  </div>
                </div>
              ))}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-3">School</th>
                  <th className="py-2 pr-3">District</th>
                  <th className="py-2 pr-3">Library</th>
                  <th className="py-2 pr-3">Computer</th>
                </tr>
              </thead>
              <tbody>
                {pagedUtilization.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(s)}>
                    <td className="py-2 pr-3 font-medium">{s.name}</td>
                    <td className="py-2 pr-3 text-gray-500">{s.district}, {s.state}</td>
                    <td className="py-2 pr-3">
                      {s.hasLibrary ? (s.libraryUsed ? "Available, used" : <span className="text-red-600">Available, unused</span>) : "Not available"}
                    </td>
                    <td className="py-2 pr-3">
                      {s.hasComputer ? (s.computerUsed ? "Available, used" : <span className="text-red-600">Available, unused</span>) : "Not available"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-3 text-sm">
              <span className="text-gray-500">
                Showing {utilizationPage * utilPageSize + 1}-{Math.min((utilizationPage + 1) * utilPageSize, utilizationFlagged.length)} of {utilizationFlagged.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setUtilizationPage((p) => Math.max(0, p - 1))}
                  disabled={utilizationPage === 0}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setUtilizationPage((p) => Math.min(utilTotalPages - 1, p + 1))}
                  disabled={utilizationPage >= utilTotalPages - 1}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 bg-black/40 z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-lg p-5 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-semibold text-lg">{selected.name}</div>
                <div className="text-sm text-gray-500">
                  {selected.district}, {selected.state} · Enrollment {selected.enrollment}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div className="p-2 rounded bg-gray-50">
                <div className="text-xs text-gray-500">Reading</div>
                <div className="font-semibold">{selected.reading.toFixed(1)}%</div>
              </div>
              <div className="p-2 rounded bg-gray-50">
                <div className="text-xs text-gray-500">Arithmetic</div>
                <div className="font-semibold">{selected.arithmetic.toFixed(1)}%</div>
              </div>
              <div className="p-2 rounded bg-gray-50">
                <div className="text-xs text-gray-500">Girls dropout risk</div>
                <div className="font-semibold">{selected.girlsDropoutRisk.toFixed(1)}%</div>
              </div>
              <div className="p-2 rounded bg-gray-50">
                <div className="text-xs text-gray-500">Priority score</div>
                <div className="font-semibold">{priorityScore(selected).toFixed(1)}</div>
              </div>
            </div>

            <div className="text-sm space-y-1">
              <div>Library: {selected.hasLibrary ? (selected.libraryUsed ? "Available and in use" : "Available, not in use") : "Not available"}</div>
              <div>Computer: {selected.hasComputer ? (selected.computerUsed ? "Available and in use" : "Available, not in use") : "Not available"}</div>
              <div>Years flagged with no improvement: {selected.yearsFlagged}</div>
              <div>Intervention on record: {selected.interventionRecorded ? "Yes" : "No"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App