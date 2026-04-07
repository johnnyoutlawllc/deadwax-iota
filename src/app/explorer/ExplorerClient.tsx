'use client'
/**
 * Data Explorer — Client Component
 * Johnny Outlaw, LLC — Designed in Greenville, TX
 *
 * Admin-only Supabase explorer:
 *  - Schema/table tree sidebar with hide/show per schema
 *  - Table browser: sortable columns, row limit, copy cell
 *  - SELECT-only SQL editor with syntax highlighting (CodeMirror)
 *  - Results grid with CSV export
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SchemaTable {
  schema_name: string
  table_name: string
  table_type: 'BASE TABLE' | 'VIEW' | string
  row_estimate: number
}

interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  ordinal_position: number
}

interface ExplorerClientProps {
  userEmail: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

function fmtCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function downloadCsv(headers: string[], rows: Record<string, unknown>[], filename: string) {
  const escape = (v: unknown) => {
    const s = fmtCell(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── SQL Syntax Highlighter ───────────────────────────────────────────────────
// Lightweight: no external dep. Regex-based highlighting for a textarea overlay.

const SQL_KEYWORDS = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|ON|AS|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|OFFSET|DISTINCT|WITH|UNION|ALL|AND|OR|NOT|IN|IS|NULL|LIKE|ILIKE|BETWEEN|CASE|WHEN|THEN|ELSE|END|COUNT|SUM|AVG|MIN|MAX|COALESCE|NULLIF|CAST|EXTRACT|TO_CHAR|TO_DATE|NOW|TRUE|FALSE|ASC|DESC|NULLS|FIRST|LAST|RETURNING|EXISTS|ANY|SOME|CROSS|NATURAL|USING|SET|FILTER|OVER|PARTITION|WINDOW|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|FIRST_VALUE|LAST_VALUE)\b/gi

function highlight(sql: string): string {
  // We'll build HTML from scratch rather than innerHTML injection
  // Escape HTML first
  let s = sql
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Strings (single-quoted)
  s = s.replace(/'([^']*)'/g, '<span style="color:#98c379">\'$1\'</span>')
  // Numbers
  s = s.replace(/\b(\d+(\.\d+)?)\b/g, '<span style="color:#d19a66">$1</span>')
  // Keywords
  s = s.replace(SQL_KEYWORDS, '<span style="color:#61afef;font-weight:600">$&</span>')
  // Comments
  s = s.replace(/(--[^\n]*)/g, '<span style="color:#5c6370;font-style:italic">$1</span>')
  // Schema.table identifiers
  s = s.replace(/\b([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\b/gi,
    '<span style="color:#e5c07b">$1</span>.<span style="color:#e5c07b">$2</span>')

  return s
}

// ─── SqlEditor component ──────────────────────────────────────────────────────

function SqlEditor({
  value, onChange, onRun, running
}: {
  value: string
  onChange: (v: string) => void
  onRun: () => void
  running: boolean
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  // Sync scroll
  const syncScroll = () => {
    if (!textareaRef.current || !highlightRef.current) return
    highlightRef.current.scrollTop = textareaRef.current.scrollTop
    highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      onRun()
    }
    // Tab → 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newVal = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newVal)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
  }

  return (
    <div style={{ position: 'relative', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 13 }}>
      {/* Highlighted layer (pointer-events:none, sits behind) */}
      <div
        ref={highlightRef}
        aria-hidden
        dangerouslySetInnerHTML={{ __html: highlight(value) + '\n' }}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          padding: '12px 14px', lineHeight: '1.6',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          color: '#abb2bf', background: 'transparent',
          overflow: 'hidden', zIndex: 1,
        }}
      />
      {/* Actual textarea on top */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => { onChange(e.target.value); syncScroll() }}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        placeholder="SELECT * FROM outlaw_data.square_catalog_items LIMIT 50;

-- Ctrl+Enter to run"
        rows={10}
        spellCheck={false}
        style={{
          position: 'relative', zIndex: 2,
          width: '100%', resize: 'vertical', minHeight: 160,
          padding: '12px 14px', lineHeight: '1.6',
          fontFamily: 'inherit', fontSize: 'inherit',
          background: 'transparent', color: 'transparent',
          caretColor: '#abb2bf',
          border: 'none', outline: 'none',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderTop: '1px solid #222' }}>
        <span style={{ fontSize: 11, color: '#555' }}>Ctrl+Enter to run · SELECT only</span>
        <button
          onClick={onRun}
          disabled={running}
          style={{
            padding: '5px 16px', borderRadius: 6, border: 'none', cursor: running ? 'not-allowed' : 'pointer',
            background: running ? '#333' : '#ff6b35', color: '#fff', fontWeight: 600, fontSize: 13,
            opacity: running ? 0.6 : 1, transition: 'opacity 0.15s',
          }}
        >
          {running ? 'Running…' : '▶ Run'}
        </button>
      </div>
    </div>
  )
}

// ─── Results grid ─────────────────────────────────────────────────────────────

function ResultsGrid({ rows, durationMs }: { rows: Record<string, unknown>[], durationMs: number | null }) {
  const [copied, setCopied] = useState<string | null>(null)

  if (rows.length === 0) return (
    <div style={{ padding: '24px', textAlign: 'center', color: '#555', fontSize: 13 }}>
      No rows returned.
    </div>
  )

  const headers = Object.keys(rows[0])

  const copyCell = (v: unknown, key: string) => {
    navigator.clipboard.writeText(fmtCell(v))
    setCopied(key)
    setTimeout(() => setCopied(null), 1200)
  }

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid #222' }}>
        <span style={{ fontSize: 12, color: '#888' }}>
          {rows.length.toLocaleString()} row{rows.length !== 1 ? 's' : ''}
          {durationMs !== null && <span style={{ color: '#555', marginLeft: 8 }}>{durationMs}ms</span>}
        </span>
        <button
          onClick={() => downloadCsv(headers, rows, `query-results-${Date.now()}.csv`)}
          style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, border: '1px solid #333', background: '#1a1a1a', color: '#aaa', cursor: 'pointer' }}
        >
          ↓ CSV
        </button>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 420 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          <thead>
            <tr style={{ background: '#111', position: 'sticky', top: 0, zIndex: 10 }}>
              {headers.map(h => (
                <th key={h} style={{ padding: '7px 12px', textAlign: 'left', color: '#ff6b35', fontWeight: 600, borderBottom: '1px solid #222', whiteSpace: 'nowrap', fontSize: 11 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                style={{ background: i % 2 === 0 ? 'transparent' : '#0d0d0d', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#0d0d0d')}
              >
                {headers.map(h => {
                  const cellKey = `${i}-${h}`
                  const v = row[h]
                  const isNull = v === null || v === undefined
                  return (
                    <td
                      key={h}
                      title="Click to copy"
                      onClick={() => copyCell(v, cellKey)}
                      style={{
                        padding: '5px 12px', borderBottom: '1px solid #111',
                        color: isNull ? '#444' : '#ccc',
                        fontStyle: isNull ? 'italic' : 'normal',
                        cursor: 'pointer', maxWidth: 360,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        background: copied === cellKey ? '#ff6b3522' : undefined,
                        transition: 'background 0.15s',
                      }}
                    >
                      {isNull ? 'null' : fmtCell(v)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Table detail panel ───────────────────────────────────────────────────────

function TableDetail({
  schema, table, onRunQuery
}: { schema: string; table: string; onRunQuery: (sql: string) => void }) {
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [preview, setPreview] = useState<Record<string, unknown>[] | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    setLoading(true)
    setPreview(null)
    Promise.all([
      supabase.rpc('get_explorer_columns', { p_schema: schema, p_table: table }),
      supabase.rpc('get_explorer_preview', { p_schema: schema, p_table: table, p_limit: 100 }),
    ]).then(([colRes, prevRes]) => {
      setColumns(colRes.data ?? [])
      // get_explorer_preview returns SETOF json, each item is already a parsed object
      const rows = (prevRes.data ?? []) as Record<string, unknown>[]
      setPreview(rows)
      setLoading(false)
    })
  }, [schema, table]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      {/* Breadcrumb + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #1e1e1e' }}>
        <div>
          <span style={{ color: '#555', fontSize: 12 }}>{schema}</span>
          <span style={{ color: '#333', fontSize: 12, margin: '0 4px' }}>/</span>
          <span style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 600 }}>{table}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onRunQuery(`SELECT *\nFROM ${schema}.${table}\nLIMIT 100;`)}
            style={{ fontSize: 12, padding: '4px 12px', borderRadius: 5, border: '1px solid #333', background: '#1a1a1a', color: '#aaa', cursor: 'pointer' }}
          >
            SELECT * → Editor
          </button>
          <button
            onClick={() => onRunQuery(`SELECT ${columns.map(c => c.column_name).join(', ')}\nFROM ${schema}.${table}\nLIMIT 100;`)}
            style={{ fontSize: 12, padding: '4px 12px', borderRadius: 5, border: '1px solid #333', background: '#1a1a1a', color: '#aaa', cursor: 'pointer' }}
          >
            Columns → Editor
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#555' }}>Loading…</div>
      ) : (
        <>
          {/* Column schema */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: '#666', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>
              Columns ({columns.length})
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                    {['Column', 'Type', 'Nullable', 'Default'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '5px 10px', color: '#555', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {columns.map(c => (
                    <tr key={c.column_name} style={{ borderBottom: '1px solid #111' }}>
                      <td style={{ padding: '5px 10px', color: '#e5c07b', fontFamily: 'monospace', fontWeight: 600 }}>{c.column_name}</td>
                      <td style={{ padding: '5px 10px', color: '#98c379', fontFamily: 'monospace' }}>{c.data_type}</td>
                      <td style={{ padding: '5px 10px', color: c.is_nullable === 'YES' ? '#666' : '#ff6b35' }}>{c.is_nullable === 'YES' ? 'YES' : 'NO'}</td>
                      <td style={{ padding: '5px 10px', color: '#666', fontFamily: 'monospace', fontSize: 11 }}>{c.column_default ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preview rows */}
          {preview && preview.length > 0 && (
            <div style={{ borderTop: '1px solid #1a1a1a', padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: '#666', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>
                Preview (first {preview.length} rows)
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 360, background: '#0d0d0d', borderRadius: 6, border: '1px solid #1e1e1e' }}>
                <ResultsGrid rows={preview} durationMs={null} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ExplorerClient({ userEmail }: ExplorerClientProps) {
  const supabase = createClient()

  // Schema tree state
  const [allTables, setAllTables] = useState<SchemaTable[]>([])
  const [hiddenSchemas, setHiddenSchemas] = useState<Set<string>>(new Set(['storage', 'auth']))
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set())
  const [schemasLoading, setSchemasLoading] = useState(true)
  const [schemaFilter, setSchemaFilter] = useState('')

  // Selected table
  const [selectedTable, setSelectedTable] = useState<{ schema: string; table: string } | null>(null)

  // SQL editor
  const [sql, setSql] = useState('SELECT *\nFROM outlaw_data.square_catalog_items\nLIMIT 50;')
  const [queryResults, setQueryResults] = useState<Record<string, unknown>[] | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [queryRunning, setQueryRunning] = useState(false)
  const [queryDuration, setQueryDuration] = useState<number | null>(null)

  // Main view: 'table' | 'sql'
  const [mainView, setMainView] = useState<'table' | 'sql'>('table')

  // Load schema tree
  useEffect(() => {
    supabase.rpc('get_explorer_schemas').then(({ data, error }) => {
      if (!error && data) {
        setAllTables(data as SchemaTable[])
        // Auto-expand first schema
        const firstSchema = (data as SchemaTable[])[0]?.schema_name
        if (firstSchema) setExpandedSchemas(new Set([firstSchema]))
      }
      setSchemasLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Group by schema
  const schemaMap = allTables.reduce<Record<string, SchemaTable[]>>((acc, t) => {
    ;(acc[t.schema_name] ??= []).push(t)
    return acc
  }, {})

  const visibleSchemas = Object.keys(schemaMap).filter(s =>
    !hiddenSchemas.has(s) &&
    (schemaFilter === '' || s.toLowerCase().includes(schemaFilter.toLowerCase()))
  )

  const toggleSchema = (s: string) =>
    setExpandedSchemas(prev => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })

  const hideSchema = (e: React.MouseEvent, s: string) => {
    e.stopPropagation()
    setHiddenSchemas(prev => new Set([...prev, s]))
    if (selectedTable?.schema === s) setSelectedTable(null)
  }

  const runQuery = useCallback(async (sqlOverride?: string) => {
    const query = (sqlOverride ?? sql).trim()
    if (!query) return
    setQueryRunning(true)
    setQueryError(null)
    setQueryResults(null)
    setMainView('sql')
    const t0 = Date.now()
    try {
      const res = await fetch('/api/explorer/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: query }),
      })
      const json = await res.json()
      setQueryDuration(Date.now() - t0)
      if (!res.ok) {
        setQueryError(json.error ?? 'Query failed')
      } else {
        setQueryResults(json.rows ?? [])
      }
    } catch (err) {
      setQueryError(String(err))
    } finally {
      setQueryRunning(false)
    }
  }, [sql])

  const handleRunFromTable = (newSql: string) => {
    setSql(newSql)
    runQuery(newSql)
  }

  // ─── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0a', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top bar ── */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 52, borderBottom: '1px solid #1a1a1a', background: '#0d0d0d', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ff6b35', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fff" />
              </svg>
            </div>
            <span style={{ color: '#555', fontSize: 13 }}>Dead Wax Records</span>
          </a>
          <span style={{ color: '#222', fontSize: 14 }}>/</span>
          <span style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 600 }}>Data Explorer</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: '#111', borderRadius: 6, border: '1px solid #1e1e1e', overflow: 'hidden' }}>
            {(['table', 'sql'] as const).map(v => (
              <button
                key={v}
                onClick={() => setMainView(v)}
                style={{
                  padding: '5px 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: mainView === v ? '#ff6b35' : 'transparent',
                  color: mainView === v ? '#fff' : '#666',
                  transition: 'all 0.15s',
                }}
              >
                {v === 'table' ? '⊞ Browse' : '⌨ SQL'}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: '#444' }}>{userEmail}</span>
          <a href="/chi" style={{ fontSize: 11, color: '#555', textDecoration: 'none', padding: '4px 10px', border: '1px solid #222', borderRadius: 4 }}>
            ← CHI
          </a>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: 260, borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0d0d0d', flexShrink: 0 }}>
          {/* Sidebar header */}
          <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              Schemas &amp; Tables
            </div>
            <input
              value={schemaFilter}
              onChange={e => setSchemaFilter(e.target.value)}
              placeholder="Filter schemas…"
              style={{
                width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #1e1e1e',
                background: '#111', color: '#ccc', fontSize: 12, outline: 'none',
              }}
            />
          </div>

          {/* Hidden schema chips */}
          {hiddenSchemas.size > 0 && (
            <div style={{ padding: '8px 14px', borderBottom: '1px solid #111', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {[...hiddenSchemas].map(s => (
                <button
                  key={s}
                  onClick={() => setHiddenSchemas(prev => { const n = new Set(prev); n.delete(s); return n })}
                  title={`Show ${s}`}
                  style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#555', cursor: 'pointer' }}
                >
                  {s} ↩
                </button>
              ))}
            </div>
          )}

          {/* Schema tree */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {schemasLoading ? (
              <div style={{ padding: 20, color: '#555', fontSize: 12, textAlign: 'center' }}>Loading schemas…</div>
            ) : visibleSchemas.length === 0 ? (
              <div style={{ padding: 20, color: '#444', fontSize: 12, textAlign: 'center' }}>No schemas</div>
            ) : (
              visibleSchemas.map(schema => {
                const tables = schemaMap[schema]
                const expanded = expandedSchemas.has(schema)
                return (
                  <div key={schema}>
                    {/* Schema row */}
                    <div
                      onClick={() => toggleSchema(schema)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid #111' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#141414')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#444', fontSize: 10 }}>{expanded ? '▾' : '▸'}</span>
                        <span style={{ color: '#ff6b35', fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{schema}</span>
                        <span style={{ fontSize: 10, color: '#444' }}>({tables.length})</span>
                      </div>
                      <button
                        onClick={e => hideSchema(e, schema)}
                        title="Hide schema"
                        style={{ fontSize: 10, color: '#333', background: 'none', border: 'none', cursor: 'pointer', padding: '1px 4px' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#666')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#333')}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Table rows */}
                    {expanded && tables.map(t => {
                      const isSelected = selectedTable?.schema === t.schema_name && selectedTable?.table === t.table_name
                      const isView = t.table_type !== 'BASE TABLE'
                      return (
                        <div
                          key={t.table_name}
                          onClick={() => { setSelectedTable({ schema: t.schema_name, table: t.table_name }); setMainView('table') }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '5px 14px 5px 28px', cursor: 'pointer',
                            background: isSelected ? '#1a0e08' : 'transparent',
                            borderLeft: isSelected ? '2px solid #ff6b35' : '2px solid transparent',
                          }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#141414' }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
                            <span style={{ fontSize: 10, color: isView ? '#61afef' : '#555', flexShrink: 0 }}>
                              {isView ? '◈' : '▪'}
                            </span>
                            <span style={{ fontSize: 12, color: isSelected ? '#ff6b35' : '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                              {t.table_name}
                            </span>
                          </div>
                          <span style={{ fontSize: 10, color: '#333', flexShrink: 0, marginLeft: 4 }}>
                            {t.row_estimate > 0 ? fmtNumber(t.row_estimate) : ''}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Browse view */}
          {mainView === 'table' && (
            selectedTable ? (
              <TableDetail
                key={`${selectedTable.schema}.${selectedTable.table}`}
                schema={selectedTable.schema}
                table={selectedTable.table}
                onRunQuery={handleRunFromTable}
              />
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#333' }}>
                <svg viewBox="0 0 24 24" fill="none" style={{ width: 40, height: 40 }}>
                  <rect x="3" y="3" width="18" height="4" rx="1" fill="#222" />
                  <rect x="3" y="10" width="18" height="4" rx="1" fill="#1a1a1a" />
                  <rect x="3" y="17" width="18" height="4" rx="1" fill="#111" />
                </svg>
                <span style={{ fontSize: 14 }}>Select a table from the sidebar</span>
                <span style={{ fontSize: 12, color: '#222' }}>or switch to SQL mode</span>
              </div>
            )
          )}

          {/* SQL view */}
          {mainView === 'sql' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Editor */}
              <div style={{ background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
                <div style={{ padding: '10px 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>SQL Editor</span>
                  <span style={{ fontSize: 10, color: '#333' }}>Read-only · 8s timeout</span>
                </div>
                <SqlEditor
                  value={sql}
                  onChange={setSql}
                  onRun={() => runQuery()}
                  running={queryRunning}
                />
              </div>

              {/* Results */}
              <div style={{ flex: 1, overflowY: 'auto', background: '#0a0a0a' }}>
                {queryRunning && (
                  <div style={{ padding: 32, textAlign: 'center', color: '#555', fontSize: 13 }}>
                    <div style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid #333', borderTopColor: '#ff6b35', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <br /><br />Running query…
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  </div>
                )}
                {queryError && !queryRunning && (
                  <div style={{ margin: 16, padding: '12px 16px', background: '#1a0808', border: '1px solid #3a1010', borderRadius: 6, color: '#e06c75', fontSize: 13, fontFamily: 'monospace' }}>
                    <strong style={{ color: '#e06c75' }}>Error</strong><br />
                    {queryError}
                  </div>
                )}
                {queryResults !== null && !queryRunning && !queryError && (
                  <div style={{ margin: 16, background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 6, overflow: 'hidden' }}>
                    <ResultsGrid rows={queryResults} durationMs={queryDuration} />
                  </div>
                )}
                {queryResults === null && !queryRunning && !queryError && (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#2a2a2a', fontSize: 13 }}>
                    Run a query to see results
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
