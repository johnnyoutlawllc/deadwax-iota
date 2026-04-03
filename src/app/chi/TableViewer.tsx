'use client'

/**
 * Dead Wax Records — TableViewer
 * Johnny Outlaw, LLC — Designed in Rockwall, TX
 *
 * Tableau Prep-style column profiling + sortable 100-row table.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import * as XLSX from 'xlsx'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColumnMeta {
  col_name: string
  data_type: string
  is_nullable: string
  ordinal: number
}

interface ColumnProfile {
  name: string
  type: string
  nullable: boolean
  totalRows: number
  nullCount: number
  nullPct: number
  distinctCount: number
  // numeric
  min?: number
  max?: number
  mean?: number
  distribution?: { label: string; count: number; pct: number }[]
  // categorical
  topValues?: { value: string; count: number; pct: number }[]
  // date
  minDate?: string
  maxDate?: string
}

interface TableEntry {
  schema_name: string
  table_name: string
  row_count: number
  size_pretty: string
}

interface Props {
  schema: string
  table: string
  allTables: TableEntry[]
  onClose: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NUMERIC_TYPES = ['integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision', 'money']
const DATE_TYPES    = ['timestamp without time zone', 'timestamp with time zone', 'date', 'timestamptz', 'timestamp']

function isNumeric(t: string) { return NUMERIC_TYPES.some(n => t.includes(n)) }
function isDate(t: string)    { return DATE_TYPES.some(d => t.includes(d)) }

function fmtNum(n: number | undefined) {
  if (n == null) return '—'
  if (Math.abs(n) >= 10000) return n.toLocaleString()
  return Number(n.toFixed(2)).toString()
}

function fmtDate(iso: string | undefined) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return iso }
}

function typeLabel(t: string) {
  if (isNumeric(t)) return 'NUM'
  if (isDate(t))    return 'DATE'
  if (t === 'boolean') return 'BOOL'
  if (t === 'text' || t === 'character varying') return 'TEXT'
  return t.toUpperCase().slice(0, 6)
}

function typeColor(t: string) {
  if (isNumeric(t)) return { bg: '#1a2a4a', color: '#60a5fa' }
  if (isDate(t))    return { bg: '#2a1a4a', color: '#a78bfa' }
  if (t === 'boolean') return { bg: '#1a3a2a', color: '#34d399' }
  return { bg: '#2a1a1a', color: '#fb923c' }
}

// Build column profiles from raw rows + metadata
function buildProfiles(rows: Record<string, unknown>[], columns: ColumnMeta[]): ColumnProfile[] {
  return columns.map(col => {
    const values = rows.map(r => r[col.col_name])
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '')
    const nullCount = values.length - nonNull.length
    const nullPct = values.length > 0 ? nullCount / values.length : 0

    const strValues = nonNull.map(v => String(v))
    const distinctCount = new Set(strValues).size

    const base: ColumnProfile = {
      name: col.col_name,
      type: col.data_type,
      nullable: col.is_nullable === 'YES',
      totalRows: values.length,
      nullCount,
      nullPct,
      distinctCount,
    }

    if (isNumeric(col.data_type)) {
      const nums = nonNull.map(Number).filter(n => !isNaN(n))
      if (nums.length === 0) return base
      const min = Math.min(...nums)
      const max = Math.max(...nums)
      const mean = nums.reduce((s, v) => s + v, 0) / nums.length

      // 8 buckets
      const range = max - min
      const buckets = 8
      const size = range === 0 ? 1 : range / buckets
      const dist = Array.from({ length: buckets }, (_, i) => {
        const lo = min + i * size
        const hi = lo + size
        const count = nums.filter(n => i === buckets - 1 ? n >= lo && n <= hi : n >= lo && n < hi).length
        return {
          label: range > 1000 ? `${Math.round(lo / 100) * 100}` : fmtNum(lo),
          count,
          pct: nums.length > 0 ? count / nums.length : 0,
        }
      })
      return { ...base, min, max, mean, distribution: dist }
    }

    if (isDate(col.data_type)) {
      const sorted = [...strValues].sort()
      return { ...base, minDate: sorted[0], maxDate: sorted[sorted.length - 1] }
    }

    // Categorical: top values
    const freq: Record<string, number> = {}
    strValues.forEach(v => { freq[v] = (freq[v] || 0) + 1 })
    const topValues = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([value, count]) => ({ value, count, pct: strValues.length > 0 ? count / strValues.length : 0 }))

    return { ...base, topValues }
  })
}

// ─── Column Profile Card ──────────────────────────────────────────────────────

function ProfileCard({ profile, selected, onClick }: {
  profile: ColumnProfile
  selected: boolean
  onClick: () => void
}) {
  const validPct = 1 - profile.nullPct
  const tc = typeColor(profile.type)

  return (
    <div
      onClick={onClick}
      className="flex flex-col gap-2 p-3 rounded-xl border cursor-pointer transition-all select-none"
      style={{
        background: selected ? '#1a1a1a' : '#111',
        borderColor: selected ? '#ff6b35' : '#2a2a2a',
        minWidth: 160,
        maxWidth: 200,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-mono text-white truncate flex-1" title={profile.name}>
          {profile.name}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded font-bold shrink-0"
          style={{ background: tc.bg, color: tc.color, fontSize: 9 }}>
          {typeLabel(profile.type)}
        </span>
      </div>

      {/* Quality bar */}
      <div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
          <div className="h-full rounded-full" style={{ width: `${validPct * 100}%`, background: '#ff6b35' }} />
        </div>
        <div className="flex justify-between mt-1" style={{ fontSize: 10 }}>
          <span style={{ color: '#aaa' }}>{(validPct * 100).toFixed(0)}% valid</span>
          {profile.nullCount > 0 && <span style={{ color: '#f87171' }}>{profile.nullCount} null</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-0.5" style={{ fontSize: 10, color: '#888' }}>
        <span>{profile.distinctCount.toLocaleString()} distinct</span>

        {/* Numeric mini histogram */}
        {profile.distribution && (
          <div className="flex items-end gap-0.5 h-8 mt-1">
            {profile.distribution.map((b, i) => (
              <div key={i} className="flex-1 rounded-sm" style={{
                height: `${Math.max(b.pct * 100, 2)}%`,
                background: b.count > 0 ? '#ff6b35' : '#2a2a2a',
                opacity: 0.4 + b.pct * 0.6,
              }} title={`${b.label}: ${b.count}`} />
            ))}
          </div>
        )}

        {/* Date range */}
        {profile.minDate && (
          <>
            <span>↓ {fmtDate(profile.minDate)}</span>
            <span>↑ {fmtDate(profile.maxDate)}</span>
          </>
        )}

        {/* Top values mini bars */}
        {profile.topValues && profile.topValues.slice(0, 3).map((tv, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="h-1.5 rounded-full shrink-0" style={{
              width: `${Math.max(tv.pct * 60, 2)}px`, background: '#ff6b35', opacity: 0.6 + tv.pct * 0.4
            }} />
            <span className="truncate" style={{ maxWidth: 90, color: '#bbb' }}>{tv.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ profile }: { profile: ColumnProfile }) {
  const tc = typeColor(profile.type)

  return (
    <div className="rounded-xl border p-4 flex flex-col gap-4" style={{ background: '#111', borderColor: '#2a2a2a' }}>
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-white">{profile.name}</span>
        <span className="text-xs px-2 py-0.5 rounded font-bold"
          style={{ background: tc.bg, color: tc.color, fontSize: 10 }}>
          {profile.type}
        </span>
        {profile.nullable && <span className="text-xs" style={{ color: '#666' }}>nullable</span>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          ['Total', profile.totalRows.toLocaleString()],
          ['Valid', (profile.totalRows - profile.nullCount).toLocaleString()],
          ['Null', profile.nullCount.toLocaleString()],
          ['Null %', `${(profile.nullPct * 100).toFixed(1)}%`],
          ['Distinct', profile.distinctCount.toLocaleString()],
          ['Unique %', `${profile.totalRows > 0 ? (profile.distinctCount / profile.totalRows * 100).toFixed(1) : 0}%`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg p-2 flex flex-col" style={{ background: '#1a1a1a' }}>
            <span style={{ fontSize: 10, color: '#666' }}>{k}</span>
            <span className="font-semibold text-sm text-white">{v}</span>
          </div>
        ))}
      </div>

      {/* Numeric stats */}
      {profile.distribution && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Min', fmtNum(profile.min)],
              ['Max', fmtNum(profile.max)],
              ['Mean', fmtNum(profile.mean)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg p-2 flex flex-col" style={{ background: '#1a1a1a' }}>
                <span style={{ fontSize: 10, color: '#666' }}>{k}</span>
                <span className="font-semibold text-sm text-white">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-1 h-16 mt-1">
            {profile.distribution.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full rounded-t" style={{
                  height: `${Math.max(b.pct * 100, 2)}%`,
                  background: '#ff6b35',
                  opacity: 0.3 + b.pct * 0.7,
                  minHeight: 2,
                }} title={`${b.label}: ${b.count}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date stats */}
      {profile.minDate && (
        <div className="grid grid-cols-2 gap-3">
          {[['Earliest', fmtDate(profile.minDate)], ['Latest', fmtDate(profile.maxDate)]].map(([k, v]) => (
            <div key={k} className="rounded-lg p-2 flex flex-col" style={{ background: '#1a1a1a' }}>
              <span style={{ fontSize: 10, color: '#666' }}>{k}</span>
              <span className="font-semibold text-sm text-white">{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Top values */}
      {profile.topValues && (
        <div className="flex flex-col gap-1.5">
          <span style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>
            Top Values ({profile.topValues.length} of {profile.distinctCount} distinct)
          </span>
          {profile.topValues.map((tv, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="shrink-0 h-2 rounded-full" style={{
                width: `${Math.max(tv.pct * 140, 2)}px`, background: '#ff6b35', opacity: 0.4 + tv.pct * 0.6
              }} />
              <span className="text-xs truncate flex-1" style={{ color: '#ccc' }}>{tv.value}</span>
              <span className="text-xs shrink-0" style={{ color: '#666' }}>
                {tv.count} ({(tv.pct * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main TableViewer ─────────────────────────────────────────────────────────

const SIDEBAR_GROUPS = [
  { label: 'Views', icon: '👁', tables: ['catalog_with_sales'] },
  { label: 'Square', icon: '🛒', tables: ['square_catalog_items','square_orders','square_order_line_items','square_payments','square_customers','square_invoices','square_merchants','square_locations'] },
  { label: 'Instagram', icon: '📸', tables: ['instagram_media','instagram_media_insights','instagram_demographics','instagram_account_history','instagram_insights'] },
  { label: 'Facebook', icon: '👥', tables: ['facebook_posts','facebook_post_metrics'] },
  { label: 'TikTok', icon: '🎵', tables: ['tiktok_videos','tiktok_video_snapshots','tiktok_accounts'] },
  { label: 'Internal', icon: '🏢', tables: ['client_accounts','clients'] },
]

export default function TableViewer({ schema, table, allTables, onClose }: Props) {
  const [activeSchema, setActiveSchema] = useState(schema)
  const [activeTable, setActiveTable]   = useState(table)
  const [rows, setRows]         = useState<Record<string, unknown>[]>([])
  const [columns, setColumns]   = useState<ColumnMeta[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [sortCol, setSortCol]   = useState<string | null>(null)
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('asc')
  const [selectedCol, setSelectedCol] = useState<string | null>(null)

  // Build a lookup: table_name → { schema, rows, size }
  const tableIndex = useMemo(() =>
    Object.fromEntries(allTables.map(t => [t.table_name, t])),
    [allTables]
  )

  function switchTable(newSchema: string, newTable: string) {
    if (newTable === activeTable) return
    setActiveSchema(newSchema)
    setActiveTable(newTable)
    setSortCol(null)
    setSortDir('asc')
    setSelectedCol(null)
    setRows([])
    setColumns([])
  }

  const fetchData = useCallback(async (col: string | null, dir: 'asc' | 'desc', sc = activeSchema, tbl = activeTable) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ schema: sc, table: tbl, dir })
      if (col) params.set('sort', col)
      const res = await fetch(`/api/chi/table-preview?${params}`)
      if (!res.ok) throw new Error((await res.json()).error)
      const json = await res.json()
      setRows(json.rows ?? [])
      setColumns(json.columns ?? [])
      setSelectedCol(json.columns?.length > 0 ? json.columns[0].col_name : null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [activeSchema, activeTable])

  useEffect(() => { fetchData(null, 'asc', activeSchema, activeTable) }, [activeSchema, activeTable])

  function handleSort(col: string) {
    const newDir = sortCol === col && sortDir === 'asc' ? 'desc' : 'asc'
    setSortCol(col)
    setSortDir(newDir)
    fetchData(col, newDir, activeSchema, activeTable)
  }

  const profiles = useMemo(() => buildProfiles(rows, columns), [rows, columns])
  const activeProfile = profiles.find(p => p.name === selectedCol) ?? null

  // Format cell value for display
  function fmtCell(val: unknown): string {
    if (val === null || val === undefined) return ''
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }

  // ── Export helpers ────────────────────────────────────────────────────────

  function exportToExcel() {
    const header = columns.map(c => c.col_name)
    const data = rows.map(row => columns.map(c => {
      const val = row[c.col_name]
      if (val === null || val === undefined) return ''
      if (typeof val === 'object') return JSON.stringify(val)
      return val
    }))
    const ws = XLSX.utils.aoa_to_sheet([header, ...data])
    // Auto-fit column widths based on header + sample content
    ws['!cols'] = header.map((h, i) => {
      const maxLen = Math.max(h.length, ...data.slice(0, 50).map(r => String(r[i] ?? '').length))
      return { wch: Math.min(maxLen + 2, 40) }
    })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, activeTable.slice(0, 31))
    XLSX.writeFile(wb, `${activeSchema}.${activeTable}.xlsx`)
  }

  function exportToCSV() {
    const header = columns.map(c => c.col_name).join(',')
    const csvRows = rows.map(row =>
      columns.map(c => {
        const val = row[c.col_name]
        if (val === null || val === undefined) return ''
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"` : str
      }).join(',')
    )
    const blob = new Blob([[header, ...csvRows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeSchema}.${activeTable}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a' }}>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: '#1e1e1e', background: '#0d0d0d' }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-sm hover:text-white transition-colors" style={{ color: '#888' }}>
            ← Back
          </button>
          <span style={{ color: '#333' }}>|</span>
          <span className="font-mono text-sm" style={{ color: '#666' }}>{activeSchema}.</span>
          <span className="font-mono text-sm font-bold text-white">{activeTable}</span>
          {!loading && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1a1a1a', color: '#666' }}>
              {rows.length} rows · {columns.length} cols
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {sortCol && (
            <span className="text-xs" style={{ color: '#666' }}>
              sorted by <span style={{ color: '#ff6b35' }}>{sortCol}</span> {sortDir === 'asc' ? '↑' : '↓'}
            </span>
          )}
          {!loading && rows.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-90 active:scale-95"
                style={{ background: '#1a6b2a', color: '#4ade80', border: '1px solid #2a3a2a' }}
                title="Export to Excel (.xlsx)"
              >
                <span>⬇</span> Excel
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-90 active:scale-95"
                style={{ background: '#1a1a2a', color: '#818cf8', border: '1px solid #2a2a3a' }}
                title="Export to CSV"
              >
                <span>⬇</span> CSV
              </button>
            </div>
          )}
          <button onClick={onClose}
            className="text-lg font-bold leading-none hover:text-white transition-colors"
            style={{ color: '#444' }}>
            ✕
          </button>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Sidebar ─────────────────────────────────────────── */}
        <div className="w-52 shrink-0 flex flex-col border-r overflow-y-auto"
          style={{ borderColor: '#1e1e1e', background: '#0d0d0d', scrollbarWidth: 'thin' }}>
          <div className="px-3 py-2 border-b" style={{ borderColor: '#1e1e1e' }}>
            <span style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: 2 }}>
              Tables &amp; Views
            </span>
          </div>
          {SIDEBAR_GROUPS.map(group => (
            <div key={group.label}>
              <div className="px-3 pt-3 pb-1 flex items-center gap-1.5">
                <span style={{ fontSize: 11 }}>{group.icon}</span>
                <span style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                  {group.label}
                </span>
              </div>
              {group.tables.map(tbl => {
                const meta = tableIndex[tbl]
                const isActive = tbl === activeTable
                const rowCount = meta ? Number(meta.row_count) : 0
                const isView = meta?.size_pretty === 'view'
                const schema = meta?.schema_name ?? 'outlaw_data'
                return (
                  <button
                    key={tbl}
                    onClick={() => switchTable(schema, tbl)}
                    className="w-full text-left px-3 py-1.5 flex items-center justify-between gap-2 transition-colors"
                    style={{
                      background: isActive ? 'rgba(255,107,53,0.12)' : 'transparent',
                      borderLeft: isActive ? '2px solid #ff6b35' : '2px solid transparent',
                    }}
                  >
                    <span className="font-mono truncate" style={{
                      fontSize: 11,
                      color: isActive ? '#ff6b35' : (rowCount > 0 || isView) ? '#aaa' : '#444',
                    }}>
                      {tbl}
                    </span>
                    {isView ? (
                      <span style={{
                        fontSize: 8, color: '#a78bfa', background: '#1e1a2e',
                        border: '1px solid #2e2a4e', borderRadius: 3,
                        padding: '1px 4px', flexShrink: 0, fontWeight: 700,
                        letterSpacing: 0.5, textTransform: 'uppercase',
                      }}>
                        VIEW
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: '#444', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {rowCount > 0 ? rowCount.toLocaleString() : '—'}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-sm" style={{ color: '#666' }}>Loading {activeTable}…</span>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-sm" style={{ color: '#f87171' }}>{error}</span>
            </div>
          ) : (
            <>
              {/* Column profile strip */}
              <div className="shrink-0 border-b" style={{ borderColor: '#1e1e1e', background: '#0d0d0d' }}>
                <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
                  {profiles.map(p => (
                    <ProfileCard
                      key={p.name}
                      profile={p}
                      selected={selectedCol === p.name}
                      onClick={() => setSelectedCol(p.name)}
                    />
                  ))}
                </div>
              </div>

              {/* Detail panel + data table */}
              <div className="flex-1 flex overflow-hidden">

                {activeProfile && (
                  <div className="w-72 shrink-0 overflow-y-auto border-r p-3"
                    style={{ borderColor: '#1e1e1e', background: '#0d0d0d', scrollbarWidth: 'thin' }}>
                    <DetailPanel profile={activeProfile} />
                  </div>
                )}

                <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin' }}>
                  <table className="text-xs w-full border-collapse" style={{ minWidth: 'max-content' }}>
                    <thead className="sticky top-0 z-10" style={{ background: '#111' }}>
                      <tr>
                        <th className="px-3 py-2 text-right font-mono border-b border-r"
                          style={{ color: '#444', borderColor: '#1e1e1e', width: 48 }}>#</th>
                        {columns.map(col => {
                          const tc = typeColor(col.data_type)
                          const isSorted = sortCol === col.col_name
                          const isSelected = selectedCol === col.col_name
                          return (
                            <th key={col.col_name}
                              onClick={() => handleSort(col.col_name)}
                              className="px-3 py-2 text-left font-mono border-b border-r cursor-pointer select-none whitespace-nowrap"
                              style={{
                                borderColor: '#1e1e1e',
                                background: isSelected ? '#1a1a1a' : isSorted ? '#151515' : '#111',
                                color: isSorted ? '#ff6b35' : '#999',
                              }}>
                              <div className="flex items-center gap-1.5">
                                <span className="px-1 rounded font-bold"
                                  style={{ background: tc.bg, color: tc.color, fontSize: 8 }}>
                                  {typeLabel(col.data_type)}
                                </span>
                                {col.col_name}
                                {isSorted && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                              </div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, ri) => (
                        <tr key={ri}
                          className="hover:bg-white/5 transition-colors"
                          style={{ background: ri % 2 === 0 ? '#0a0a0a' : '#0d0d0d' }}>
                          <td className="px-3 py-1.5 text-right border-r font-mono select-none"
                            style={{ color: '#333', borderColor: '#1a1a1a' }}>
                            {ri + 1}
                          </td>
                          {columns.map(col => {
                            const val = row[col.col_name]
                            const isNull = val === null || val === undefined
                            const isSelected = selectedCol === col.col_name
                            return (
                              <td key={col.col_name}
                                onClick={() => setSelectedCol(col.col_name)}
                                className="px-3 py-1.5 border-r cursor-pointer whitespace-nowrap"
                                style={{
                                  borderColor: '#1a1a1a',
                                  background: isSelected ? 'rgba(255,107,53,0.04)' : undefined,
                                  color: isNull ? '#333' : '#ccc',
                                  fontStyle: isNull ? 'italic' : undefined,
                                  maxWidth: 300,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}>
                                {isNull ? 'null' : fmtCell(val)}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
