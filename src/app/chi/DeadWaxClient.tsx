'use client'

/**
 * Dead Wax Records — Management Dashboard (Client Component)
 * Johnny Outlaw, LLC — Designed in Rockwall, TX
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import TableViewer from './TableViewer'
import DatabaseMasterOverview, { type RawColumnProfile } from './DatabaseMasterOverview'
import CatalogOverview, { type CatalogData } from './CatalogOverview'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SquareSummary {
  total_orders: number
  total_revenue: number
  avg_order: number
  last_order: string
}

interface TopItem {
  name: string
  times_sold: number
  revenue: number
}

interface Payment {
  payment_id: string
  amount_money: number
  total_money: number
  tip_money: number | null
  source_type: string
  created_at: string
  status: string
  card_brand: string | null
  last_4: string | null
  note: string | null
}

interface InstagramMedia {
  media_id: string
  caption: string | null
  media_type: string
  ts: string
  likes: number | null
  comments: number | null
  saved: number | null
}

interface InstagramAccount {
  account_id: string
  username: string
  followers_count: number
  media_count: number
  updated: string
}

interface DemographicRow {
  breakdown_type: string
  key: string
  value: number
  date: string
}

interface FacebookPost {
  post_id: string
  message: string | null
  created_time: string
  impressions: number | null
  engaged_users: number | null
  likes: number | null
  clicks: number | null
}

interface DbStatRow {
  schema_name: string
  table_name: string
  row_count: number
  size_pretty: string
  size_bytes: number
}

interface SquareKpis {
  customer_count: number
  unique_items_sold: number
  total_sales_cents: number
}

interface SalesByDate {
  sale_date: string
  order_count: number
  total_money_cents: number
}

interface SalesByFormat {
  format: string
  times_sold: number
  revenue_cents: number
  item_count: number
}

interface SalesByCondition {
  condition: string
  times_sold: number
  revenue_cents: number
}

interface CatalogByGenre {
  genre: string
  times_sold: number
  revenue_cents: number
}

interface InventoryByYear {
  release_year: number
  times_sold: number
  revenue_cents: number
}

interface Props {
  squareSummary: SquareSummary | null
  squareTopItems: TopItem[]
  recentPayments: Payment[]
  instagramMedia: InstagramMedia[]
  instagramAccount: InstagramAccount | null
  instagramDemographics: DemographicRow[]
  facebookPosts: FacebookPost[]
  dbStats: DbStatRow[]
  columnProfiles: RawColumnProfile[]
  catalogOverview: CatalogData | null
  enrichmentStats: EnrichmentStats | null
  enrichmentSample: EnrichmentSample[]
  squareKpis: SquareKpis | null
  squareSalesByDate: SalesByDate[]
  squareSalesByFormat: SalesByFormat[]
  squareSalesByCondition: SalesByCondition[]
  squareCatalogByGenre: CatalogByGenre[]
  squareInventoryByYear: InventoryByYear[]
  squareFlatFacts: FlatFact[]
  userEmail: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(cents: number | null) {
  if (cents == null) return '—'
  return `$${(cents / 100).toFixed(2)}`
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function truncate(str: string | null, max = 120) {
  if (!str) return '—'
  return str.length > max ? str.slice(0, max) + '…' : str
}

// ─── Shared Components ────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = false }: {
  label: string; value: string | number; sub?: string; accent?: boolean
}) {
  return (
    <div className={`rounded-xl p-4 flex flex-col gap-1 bg-surface ${accent ? 'border border-accent' : 'border border-border'}`}>
      <span className="text-xs uppercase tracking-widest text-text-muted">{label}</span>
      <span className="text-2xl font-bold text-text-primary">{value}</span>
      {sub && <span className="text-xs text-text-muted">{sub}</span>}
    </div>
  )
}

function TabButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
        active
          ? 'bg-accent text-white'
          : 'text-text-secondary border border-border hover:border-accent hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  )
}

function SectionHeader({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">{children}</h3>
      {right && <span className="text-xs text-text-muted">{right}</span>}
    </div>
  )
}

// ─── Square Panel ─────────────────────────────────────────────────────────────

const ORANGE = '#ff6b35'
const PINK   = '#e879a0'

function fmtDollars(cents: number) {
  const d = cents / 100
  if (d >= 1000000) return `$${(d / 1000000).toFixed(1)}M`
  if (d >= 1000)    return `$${(d / 1000).toFixed(0)}K`
  return `$${d.toFixed(0)}`
}

function fmtDateShort(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function DualBarRow({ label, val1, max1, val2, max2, fmt1, fmt2, color1 = ORANGE, color2 = PINK, selected, onClick }: {
  label: string; val1: number; max1: number; val2: number; max2: number
  fmt1: (v: number) => string; fmt2: (v: number) => string
  color1?: string; color2?: string; selected?: boolean; onClick?: () => void
}) {
  const pct1 = max1 > 0 ? (val1 / max1) * 100 : 0
  const pct2 = max2 > 0 ? (val2 / max2) * 100 : 0
  return (
    <div onClick={onClick} className="flex items-center gap-2 py-1 px-2 rounded transition-colors"
      style={{ cursor: onClick ? 'pointer' : 'default', background: selected ? 'rgba(255,107,53,0.1)' : 'transparent' }}>
      <span className="text-xs text-right shrink-0 truncate" style={{ width: 120, color: '#ccc' }} title={label}>{label}</span>
      <div className="flex items-center gap-1 flex-1">
        <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ background: '#1a1a1a' }}>
          <div className="h-full rounded-sm" style={{ width: `${pct1}%`, background: color1, opacity: 0.85 }} />
        </div>
        <span className="text-xs tabular-nums shrink-0" style={{ color: '#aaa', width: 40, textAlign: 'right' }}>{fmt1(val1)}</span>
      </div>
      <div className="flex items-center gap-1 flex-1">
        <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ background: '#1a1a1a' }}>
          <div className="h-full rounded-sm" style={{ width: `${pct2}%`, background: color2, opacity: 0.85 }} />
        </div>
        <span className="text-xs tabular-nums shrink-0" style={{ color: '#aaa', width: 52, textAlign: 'right' }}>{fmt2(val2)}</span>
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border flex flex-col" style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}>
      <div className="px-4 pt-3 pb-2 border-b" style={{ borderColor: '#1a1a1a' }}>
        <div className="text-sm font-semibold text-white">{title}</div>
        {subtitle && <div className="text-xs mt-0.5" style={{ color: '#555' }}>{subtitle}</div>}
      </div>
      <div className="flex-1 p-3">{children}</div>
    </div>
  )
}

// ── Client-side cross-filter aggregation ──────────────────────────────────────

interface FlatFact {
  order_id: string
  sale_date: string
  format: string
  condition: string
  genres: string | null
  release_year: number | null
  revenue_cents: number
}

function applyFilters(
  facts: FlatFact[],
  filters: { format: string | null; condition: string | null; genre: string | null; year: number | null; date: string | null },
  exclude: 'format' | 'condition' | 'genre' | 'year' | 'date' | null = null
) {
  return facts.filter(f => {
    if (exclude !== 'format'    && filters.format    && f.format !== filters.format) return false
    if (exclude !== 'condition' && filters.condition && f.condition !== filters.condition) return false
    if (exclude !== 'year'      && filters.year      && f.release_year !== filters.year) return false
    if (exclude !== 'date'      && filters.date      && f.sale_date !== filters.date) return false
    if (exclude !== 'genre'     && filters.genre) {
      const genreList = (f.genres ?? '').split(',').map(g => g.trim())
      if (!genreList.includes(filters.genre!)) return false
    }
    return true
  })
}

function aggByDate(facts: FlatFact[]): SalesByDate[] {
  const m: Record<string, { order_count: number; total_money_cents: number }> = {}
  facts.forEach(f => {
    if (!m[f.sale_date]) m[f.sale_date] = { order_count: 0, total_money_cents: 0 }
    m[f.sale_date].order_count++
    m[f.sale_date].total_money_cents += f.revenue_cents
  })
  return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]))
    .map(([sale_date, v]) => ({ sale_date, ...v }))
}

function aggByFormat(facts: FlatFact[]): SalesByFormat[] {
  const m: Record<string, { times_sold: number; revenue_cents: number }> = {}
  facts.forEach(f => {
    if (!m[f.format]) m[f.format] = { times_sold: 0, revenue_cents: 0 }
    m[f.format].times_sold++
    m[f.format].revenue_cents += f.revenue_cents
  })
  return Object.entries(m).sort((a, b) => b[1].times_sold - a[1].times_sold)
    .map(([format, v]) => ({ format, item_count: 0, ...v }))
}

function aggByCondition(facts: FlatFact[]): SalesByCondition[] {
  const m: Record<string, { times_sold: number; revenue_cents: number }> = {}
  facts.forEach(f => {
    if (!m[f.condition]) m[f.condition] = { times_sold: 0, revenue_cents: 0 }
    m[f.condition].times_sold++
    m[f.condition].revenue_cents += f.revenue_cents
  })
  return Object.entries(m).sort((a, b) => b[1].times_sold - a[1].times_sold)
    .map(([condition, v]) => ({ condition, ...v }))
}

function aggByGenre(facts: FlatFact[]): CatalogByGenre[] {
  const m: Record<string, { times_sold: number; revenue_cents: number }> = {}
  facts.forEach(f => {
    const genres = (f.genres ?? '').split(',').map(g => g.trim()).filter(Boolean)
    genres.forEach(genre => {
      if (!m[genre]) m[genre] = { times_sold: 0, revenue_cents: 0 }
      m[genre].times_sold++
      m[genre].revenue_cents += f.revenue_cents
    })
  })
  return Object.entries(m).sort((a, b) => b[1].times_sold - a[1].times_sold)
    .slice(0, 20).map(([genre, v]) => ({ genre, ...v }))
}

function aggByYear(facts: FlatFact[]): InventoryByYear[] {
  const m: Record<number, { times_sold: number; revenue_cents: number }> = {}
  facts.forEach(f => {
    if (!f.release_year) return
    if (!m[f.release_year]) m[f.release_year] = { times_sold: 0, revenue_cents: 0 }
    m[f.release_year].times_sold++
    m[f.release_year].revenue_cents += f.revenue_cents
  })
  return Object.entries(m).sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([yr, v]) => ({ release_year: Number(yr), ...v }))
}

// ── SquarePanel component ──────────────────────────────────────────────────────

function SquarePanel({ kpis, salesByDate, salesByFormat, salesByCondition, catalogByGenre, inventoryByYear, flatFacts }: {
  kpis: SquareKpis | null
  salesByDate: SalesByDate[]
  salesByFormat: SalesByFormat[]
  salesByCondition: SalesByCondition[]
  catalogByGenre: CatalogByGenre[]
  inventoryByYear: InventoryByYear[]
  flatFacts: FlatFact[]
}) {
  const [filterFormat, setFilterFormat]       = useState<string | null>(null)
  const [filterCondition, setFilterCondition] = useState<string | null>(null)
  const [filterGenre, setFilterGenre]         = useState<string | null>(null)
  const [filterYear, setFilterYear]           = useState<number | null>(null)
  const [filterDate, setFilterDate]           = useState<string | null>(null)

  const hasFilter = !!(filterFormat || filterCondition || filterGenre || filterYear || filterDate)
  const filters   = { format: filterFormat, condition: filterCondition, genre: filterGenre, year: filterYear, date: filterDate }

  // Always derive from flat facts — consistent baseline whether filtered or not.
  // Each chart excludes its own dimension so clicking a bar shows full range cross-filtered.
  const activeDateData       = aggByDate(applyFilters(flatFacts, filters, 'date'))
  const activeFormatData     = aggByFormat(applyFilters(flatFacts, filters, 'format'))
  const activeConditionData  = aggByCondition(applyFilters(flatFacts, filters, 'condition'))
  const activeGenreData      = aggByGenre(applyFilters(flatFacts, filters, 'genre'))
  const activeYearData       = aggByYear(applyFilters(flatFacts, filters, 'year'))

  // Chart maxes
  const dateSlice    = activeDateData.slice(-30)
  const maxOrders    = Math.max(...dateSlice.map(d => d.order_count), 1)
  const maxMoney     = Math.max(...dateSlice.map(d => d.total_money_cents), 1)
  const maxFmtSold   = Math.max(...activeFormatData.map(f => f.times_sold), 1)
  const maxFmtRev    = Math.max(...activeFormatData.map(f => f.revenue_cents), 1)
  const maxCondSold  = Math.max(...activeConditionData.map(c => c.times_sold), 1)
  const maxCondRev   = Math.max(...activeConditionData.map(c => c.revenue_cents), 1)
  const maxGenreSold  = Math.max(...activeGenreData.map(g => g.times_sold), 1)
  const maxGenreRev   = Math.max(...activeGenreData.map(g => g.revenue_cents), 1)
  const maxYearSold   = Math.max(...activeYearData.map(y => y.times_sold), 1)
  const maxYearRev    = Math.max(...activeYearData.map(y => y.revenue_cents), 1)

  // Filtered KPI totals
  const filteredFacts = hasFilter ? applyFilters(flatFacts, filters) : null
  const filteredRevenue = filteredFacts ? filteredFacts.reduce((s, f) => s + f.revenue_cents, 0) : null

  function clearAll() { setFilterFormat(null); setFilterCondition(null); setFilterGenre(null); setFilterYear(null); setFilterDate(null) }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Square sub-tab nav ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b pb-3" style={{ borderColor: '#1e1e1e' }}>
        <button
          className="px-4 py-1.5 text-sm font-semibold rounded-lg transition-all"
          style={{ background: '#ff6b35', color: '#fff' }}
        >
          📊 Sales
        </button>
        <button
          className="px-4 py-1.5 text-sm rounded-lg transition-all cursor-not-allowed"
          style={{ color: '#444', border: '1px solid #222' }}
          title="Coming soon"
        >
          📦 Inventory
        </button>
        <button
          className="px-4 py-1.5 text-sm rounded-lg transition-all cursor-not-allowed"
          style={{ color: '#444', border: '1px solid #222' }}
          title="Coming soon"
        >
          👥 Customers
        </button>
      </div>

      {/* ── Active filter bar — TOP ──────────────────────────────────────────── */}
      {hasFilter && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 rounded-lg border text-xs"
          style={{ background: '#1a1a0a', borderColor: '#3a3a1a', color: '#aaa' }}>
          <span style={{ color: ORANGE, fontWeight: 600 }}>Filters:</span>
          {filterFormat    && (
            <button onClick={() => setFilterFormat(null)}
              className="flex items-center gap-1 px-2 py-0.5 rounded hover:opacity-80"
              style={{ background: '#2a1a0a', color: ORANGE }}>
              Format: {filterFormat} <span style={{ fontSize: 10 }}>✕</span>
            </button>
          )}
          {filterCondition && (
            <button onClick={() => setFilterCondition(null)}
              className="flex items-center gap-1 px-2 py-0.5 rounded hover:opacity-80"
              style={{ background: '#2a1a0a', color: ORANGE }}>
              Condition: {filterCondition} <span style={{ fontSize: 10 }}>✕</span>
            </button>
          )}
          {filterGenre     && (
            <button onClick={() => setFilterGenre(null)}
              className="flex items-center gap-1 px-2 py-0.5 rounded hover:opacity-80"
              style={{ background: '#2a1a0a', color: ORANGE }}>
              Genre: {filterGenre} <span style={{ fontSize: 10 }}>✕</span>
            </button>
          )}
          {filterYear      && (
            <button onClick={() => setFilterYear(null)}
              className="flex items-center gap-1 px-2 py-0.5 rounded hover:opacity-80"
              style={{ background: '#2a1a0a', color: ORANGE }}>
              Year: {filterYear} <span style={{ fontSize: 10 }}>✕</span>
            </button>
          )}
          {filterDate      && (
            <button onClick={() => setFilterDate(null)}
              className="flex items-center gap-1 px-2 py-0.5 rounded hover:opacity-80"
              style={{ background: '#2a1a0a', color: ORANGE }}>
              Date: {fmtDateShort(filterDate)} <span style={{ fontSize: 10 }}>✕</span>
            </button>
          )}
          {filteredRevenue !== null && (
            <span className="ml-2" style={{ color: '#666' }}>
              {filteredFacts!.length.toLocaleString()} orders · {fmtDollars(filteredRevenue)} revenue
            </span>
          )}
          <button onClick={clearAll} className="ml-auto hover:opacity-80 text-xs" style={{ color: '#555' }}>
            Clear all
          </button>
        </div>
      )}

      {/* ── Row 1: KPI cards + Sales by Date ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* KPI stack */}
        <div className="flex flex-col gap-3">
          {[
            { label: 'Customer Count',    value: kpis?.customer_count?.toLocaleString() ?? '—' },
            { label: 'Unique Items Sold', value: kpis?.unique_items_sold?.toLocaleString() ?? '—' },
            { label: 'Total Sales',       value: kpis ? fmtDollars(kpis.total_sales_cents) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border flex flex-col items-center justify-center py-4 gap-1"
              style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}>
              <span className="text-2xl font-bold text-white">{value}</span>
              <span className="text-xs" style={{ color: '#555' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Sales by Date */}
        <div className="lg:col-span-2">
          <ChartCard title="Sales by Date" subtitle="last 30 days · click bar to filter · bars = orders, line = revenue">
            {dateSlice.length === 0 ? (
              <div className="text-xs text-center py-6" style={{ color: '#444' }}>No data for this selection</div>
            ) : (
              <div className="flex flex-col gap-1">
                <svg viewBox={`0 0 ${dateSlice.length * 18} 80`} className="w-full" style={{ height: 100, cursor: 'pointer' }} preserveAspectRatio="none">
                  <polyline fill="none" stroke={PINK} strokeWidth="1.5"
                    points={dateSlice.map((d, i) => `${i * 18 + 9},${76 - (d.total_money_cents / maxMoney) * 70}`).join(' ')} />
                  {dateSlice.map((d, i) => {
                    const barH = (d.order_count / maxOrders) * 60
                    const isSelected = filterDate === d.sale_date
                    return (
                      <rect key={i} x={i * 18 + 2} y={76 - barH} width={14} height={barH}
                        fill={ORANGE} opacity={isSelected ? 1 : 0.75} rx={1}
                        onClick={() => setFilterDate(p => p === d.sale_date ? null : d.sale_date)}
                      >
                        <title>{fmtDateShort(d.sale_date)}: {d.order_count} orders</title>
                      </rect>
                    )
                  })}
                </svg>
                <div className="flex justify-between px-1" style={{ fontSize: 9, color: '#444' }}>
                  {dateSlice.filter((_, i) => i % 7 === 0 || i === dateSlice.length - 1).map(d => (
                    <span key={d.sale_date}>{fmtDateShort(d.sale_date)}</span>
                  ))}
                </div>
                <div className="flex gap-4 justify-end mt-1" style={{ fontSize: 10, color: '#666' }}>
                  <span><span style={{ color: ORANGE }}>■</span> Order Count</span>
                  <span><span style={{ color: PINK }}>─</span> Revenue</span>
                </div>
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* ── Row 2: Sales by Format + Sales by Condition ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Sales by Format" subtitle="click to filter">
          <div className="flex items-center gap-2 mb-1 px-2" style={{ fontSize: 10, color: '#555' }}>
            <span style={{ width: 120 }} />
            <span className="flex-1 text-center">Times Sold</span>
            <span className="flex-1 text-center">Revenue Dollars</span>
          </div>
          {activeFormatData.map(f => (
            <DualBarRow key={f.format} label={f.format}
              val1={f.times_sold} max1={maxFmtSold} val2={f.revenue_cents} max2={maxFmtRev}
              fmt1={v => v.toLocaleString()} fmt2={v => fmtDollars(v)}
              selected={filterFormat === f.format}
              onClick={() => setFilterFormat(p => p === f.format ? null : f.format)} />
          ))}
          {activeFormatData.length === 0 && <div className="text-xs text-center py-4" style={{ color: '#666' }}>No sales match this filter combination</div>}
        </ChartCard>

        <ChartCard title="Sales by Condition" subtitle="click to filter">
          <div className="flex items-center gap-2 mb-1 px-2" style={{ fontSize: 10, color: '#555' }}>
            <span style={{ width: 120 }} />
            <span className="flex-1 text-center">Times Sold</span>
            <span className="flex-1 text-center">Revenue Dollars</span>
          </div>
          {activeConditionData.map(c => (
            <DualBarRow key={c.condition} label={c.condition}
              val1={c.times_sold} max1={maxCondSold} val2={c.revenue_cents} max2={maxCondRev}
              fmt1={v => v.toLocaleString()} fmt2={v => fmtDollars(v)}
              selected={filterCondition === c.condition}
              onClick={() => setFilterCondition(p => p === c.condition ? null : c.condition)} />
          ))}
          {activeConditionData.length === 0 && <div className="text-xs text-center py-4" style={{ color: '#666' }}>No sales match this filter combination</div>}
        </ChartCard>
      </div>

      {/* ── Row 3: Catalog by Genre + Inventory by Release Year ───────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Sales by Genre" subtitle="click to filter">
          <div className="flex items-center gap-2 mb-1 px-2" style={{ fontSize: 10, color: '#555' }}>
            <span style={{ width: 120 }} />
            <span className="flex-1 text-center">Times Sold</span>
            <span className="flex-1 text-center">Sales</span>
          </div>
          {activeGenreData.length > 0 ? activeGenreData.slice(0, 15).map(g => (
            <DualBarRow key={g.genre} label={g.genre}
              val1={g.times_sold} max1={maxGenreSold} val2={g.revenue_cents} max2={maxGenreRev}
              fmt1={v => v.toLocaleString()} fmt2={v => fmtDollars(v)}
              selected={filterGenre === g.genre}
              onClick={() => setFilterGenre(p => p === g.genre ? null : g.genre)} />
          )) : hasFilter ? (
            <div className="text-xs text-center py-8" style={{ color: '#666' }}>
              No genre data matches this filter combination
            </div>
          ) : (
            <div className="text-xs text-center py-8" style={{ color: '#444' }}>
              Enrichment still running — genre data will appear as albums are matched
            </div>
          )}
        </ChartCard>

        <ChartCard title="Sales by Release Year" subtitle="click to filter">
          {activeYearData.length > 0 ? (
            <div className="flex flex-col gap-2">
              <div>
                <div className="text-xs mb-1" style={{ color: '#555' }}>Times Sold</div>
                <svg viewBox={`0 0 ${activeYearData.length * 8} 40`} className="w-full" style={{ height: 50 }} preserveAspectRatio="none">
                  {activeYearData.map((y, i) => {
                    const barH = (y.times_sold / maxYearSold) * 36
                    return <rect key={i} x={i * 8 + 1} y={38 - barH} width={6} height={barH}
                      fill={ORANGE} opacity={filterYear === y.release_year ? 1 : 0.7} rx={1}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setFilterYear(p => p === y.release_year ? null : y.release_year)} />
                  })}
                </svg>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: '#555' }}>Sales</div>
                <svg viewBox={`0 0 ${activeYearData.length * 8} 40`} className="w-full" style={{ height: 50 }} preserveAspectRatio="none">
                  {activeYearData.map((y, i) => {
                    const barH = (y.revenue_cents / maxYearRev) * 36
                    return <rect key={i} x={i * 8 + 1} y={38 - barH} width={6} height={barH}
                      fill={PINK} opacity={filterYear === y.release_year ? 1 : 0.7} rx={1}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setFilterYear(p => p === y.release_year ? null : y.release_year)} />
                  })}
                </svg>
              </div>
              <div className="flex justify-between" style={{ fontSize: 9, color: '#444' }}>
                {[activeYearData[0], ...activeYearData.filter((_, i) => i % Math.max(Math.floor(activeYearData.length / 5), 1) === 0), activeYearData[activeYearData.length - 1]]
                  .filter((v, i, a) => a.findIndex(x => x.release_year === v.release_year) === i)
                  .map(y => <span key={y.release_year}>{y.release_year}</span>)}
              </div>
            </div>
          ) : (
            <div className="text-xs text-center py-8" style={{ color: '#444' }}>
              Enrichment still running — release year data will appear as albums are matched
            </div>
          )}
        </ChartCard>
      </div>

    </div>
  )
}

// ─── Instagram Panel ──────────────────────────────────────────────────────────

function InstagramPanel({ account, media, demographics }: {
  account: InstagramAccount | null
  media: InstagramMedia[]
  demographics: DemographicRow[]
}) {
  const ageDemos = demographics.filter(d => d.breakdown_type === 'age')
    .reduce<Record<string, number>>((acc, d) => {
      acc[d.key] = (acc[d.key] || 0) + Number(d.value)
      return acc
    }, {})

  const cityDemos = demographics.filter(d => d.breakdown_type === 'city')
    .reduce<Record<string, number>>((acc, d) => {
      acc[d.key] = (acc[d.key] || 0) + Number(d.value)
      return acc
    }, {})

  const topCities = Object.entries(cityDemos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const genderDemos = demographics.filter(d => d.breakdown_type === 'gender')
    .reduce<Record<string, number>>((acc, d) => {
      acc[d.key] = (acc[d.key] || 0) + Number(d.value)
      return acc
    }, {})

  const totalGender = Object.values(genderDemos).reduce((s, v) => s + v, 0)
  const ageKeys = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
  const maxAge = Math.max(...ageKeys.map(k => ageDemos[k] || 0))

  return (
    <div className="flex flex-col gap-6">

      {/* Account stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Followers" value={account?.followers_count?.toLocaleString() ?? '—'} sub={`@${account?.username ?? 'dead_wax_dallas'}`} accent />
        <StatCard label="Posts" value={account?.media_count?.toLocaleString() ?? '—'} sub="total media" />
        <StatCard label="Last Synced" value={account ? fmtRelative(account.updated) : '—'} sub={account ? fmtDate(account.updated) : undefined} />
      </div>

      {/* Age demographics */}
      {Object.keys(ageDemos).length > 0 && (
        <section>
          <SectionHeader>👥 Audience Age</SectionHeader>
          <div className="rounded-xl p-4 bg-surface border border-border flex items-end gap-2 h-36">
            {ageKeys.map(key => {
              const val = ageDemos[key] || 0
              const pct = maxAge > 0 ? (val / maxAge) * 100 : 0
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-text-muted">{val > 0 ? val.toLocaleString() : ''}</span>
                  <div className="w-full rounded-t transition-all" style={{
                    height: `${Math.max(pct, 3)}%`, background: '#ff6b35', opacity: pct > 80 ? 1 : 0.5 + (pct / 200), minHeight: 4
                  }} />
                  <span className="text-xs text-text-muted">{key}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Gender + Top Cities row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Gender */}
        {totalGender > 0 && (
          <section>
            <SectionHeader>⚡ Gender Split</SectionHeader>
            <div className="rounded-xl p-4 bg-surface border border-border flex flex-col gap-3">
              {[['M', 'Male'], ['F', 'Female'], ['U', 'Unknown']].map(([key, label]) => {
                const val = genderDemos[key] || 0
                const pct = totalGender > 0 ? ((val / totalGender) * 100).toFixed(1) : '0'
                return (
                  <div key={key} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>{label}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#ff6b35' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Top Cities */}
        {topCities.length > 0 && (
          <section>
            <SectionHeader>📍 Top Cities</SectionHeader>
            <div className="rounded-xl overflow-hidden border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {topCities.map(([city, count], i) => (
                    <tr key={city} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}>
                      <td className="px-4 py-2 text-text-primary">{city}</td>
                      <td className="px-4 py-2 text-right font-semibold text-text-muted">{count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Recent posts */}
      <section>
        <SectionHeader right={`${media.length} posts`}>📸 Recent Posts</SectionHeader>
        <div className="flex flex-col gap-2">
          {media.map(post => {
            const totalEngagement = (Number(post.likes) || 0) + (Number(post.comments) || 0)
            return (
              <div key={post.media_id} className="rounded-xl p-4 bg-surface border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-background text-text-muted border border-border">
                      {post.media_type}
                    </span>
                    <span className="text-xs text-text-muted">{fmtRelative(post.ts)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    {post.likes != null && <span>❤️ {Number(post.likes).toLocaleString()}</span>}
                    {post.comments != null && <span>💬 {Number(post.comments).toLocaleString()}</span>}
                    {post.saved != null && <span>🔖 {Number(post.saved).toLocaleString()}</span>}
                  </div>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{truncate(post.caption)}</p>
              </div>
            )
          })}
        </div>
      </section>

    </div>
  )
}

// ─── Facebook Panel ───────────────────────────────────────────────────────────

function FacebookPanel({ posts }: { posts: FacebookPost[] }) {
  const totalClicks = posts.reduce((s, p) => s + (Number(p.clicks) || 0), 0)
  const totalImpressions = posts.reduce((s, p) => s + (Number(p.impressions) || 0), 0)
  const totalLikes = posts.reduce((s, p) => s + (Number(p.likes) || 0), 0)

  return (
    <div className="flex flex-col gap-6">

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Posts" value={posts.length} sub="tracked" accent />
        <StatCard label="Total Clicks" value={totalClicks.toLocaleString()} sub="across all posts" />
        <StatCard label="Total Impressions" value={totalImpressions > 0 ? totalImpressions.toLocaleString() : '—'} sub="not yet synced" />
        <StatCard label="Total Likes" value={totalLikes > 0 ? totalLikes.toLocaleString() : '—'} sub="reactions" />
      </div>

      <section>
        <SectionHeader right={`${posts.length} posts`}>📣 All Posts</SectionHeader>
        <div className="flex flex-col gap-3">
          {posts.map((post, i) => (
            <div key={post.post_id} className={`rounded-xl p-4 border border-border ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}>
              <div className="flex items-start justify-between gap-4 mb-2">
                <span className="text-xs text-text-muted">{fmtDate(post.created_time)}</span>
                <div className="flex items-center gap-3 text-xs text-text-muted shrink-0">
                  {post.clicks != null && <span>🖱 {Number(post.clicks).toLocaleString()} clicks</span>}
                  {post.likes != null && <span>❤️ {Number(post.likes).toLocaleString()}</span>}
                  {post.engaged_users != null && <span>👥 {Number(post.engaged_users).toLocaleString()} engaged</span>}
                </div>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{truncate(post.message, 200)}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

// ─── TikTok Panel ─────────────────────────────────────────────────────────────

function TikTokPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="text-5xl">🎵</div>
      <h3 className="text-lg font-semibold text-text-primary">TikTok Not Connected</h3>
      <p className="text-sm text-text-muted text-center max-w-sm">
        The TikTok tables are set up and ready — accounts, videos, and snapshots — but no data has been synced yet.
        Connect the TikTok API to start pulling in video performance data.
      </p>
      <div className="mt-4 rounded-xl p-4 bg-surface border border-border w-full max-w-sm">
        <div className="flex flex-col gap-2 text-xs text-text-muted font-mono">
          <div className="flex justify-between"><span>tiktok_accounts</span><span className="text-yellow-500">0 rows</span></div>
          <div className="flex justify-between"><span>tiktok_videos</span><span className="text-yellow-500">0 rows</span></div>
          <div className="flex justify-between"><span>tiktok_video_snapshots</span><span className="text-yellow-500">0 rows</span></div>
        </div>
      </div>
    </div>
  )
}

// ─── Database Panel ───────────────────────────────────────────────────────────

// ── Auto-grouping: new tables appear automatically based on name prefix ────────
const PREFIX_META: Record<string, { label: string; icon: string; order: number }> = {
  square:    { label: 'Square — Commerce', icon: '🛒', order: 1 },
  instagram: { label: 'Instagram',         icon: '📸', order: 2 },
  facebook:  { label: 'Facebook',          icon: '👥', order: 3 },
  tiktok:    { label: 'TikTok',            icon: '🎵', order: 4 },
  catalog:   { label: 'Enrichment',        icon: '✨', order: 5 },
  client:    { label: 'Internal',          icon: '🏢', order: 6 },
  johnny:    { label: 'Internal',          icon: '🏢', order: 6 },
}

function deriveCategories(stats: DbStatRow[]) {
  const groups: Record<string, { label: string; icon: string; order: number; tables: string[] }> = {}
  for (const row of stats) {
    const prefix = row.table_name.split('_')[0]
    const meta   = PREFIX_META[prefix] ?? { label: 'Other', icon: '📦', order: 99 }
    const key    = meta.label
    if (!groups[key]) groups[key] = { ...meta, tables: [] }
    groups[key].tables.push(row.table_name)
  }
  return Object.values(groups).sort((a, b) => a.order - b.order)
}

function DatabasePanel({ stats, onViewTable }: {
  stats: DbStatRow[]
  onViewTable: (schema: string, table: string) => void
}) {
  const byTable    = Object.fromEntries(stats.map(r => [r.table_name, r]))
  const totalRows  = stats.reduce((s, r) => s + Number(r.row_count), 0)
  const totalBytes = stats.reduce((s, r) => s + Number(r.size_bytes), 0)
  const categories = deriveCategories(stats)

  function fmtSize(bytes: number) {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} kB`
    return `${bytes} B`
  }

  // Determine schema for a table name
  function schemaFor(tableName: string): string {
    const row = byTable[tableName]
    return row?.schema_name ?? 'outlaw_data'
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Rows" value={totalRows.toLocaleString()} sub="live records" accent />
        <StatCard label="Total Size" value={fmtSize(totalBytes)} sub="on disk" />
        <StatCard label="Tables" value={stats.length} sub="outlaw_data + johnny_outlaw" />
      </div>

      {categories.map(cat => {
        const catStats = cat.tables.map(t => byTable[t]).filter(Boolean)
        const catRows = catStats.reduce((s, r) => s + Number(r.row_count), 0)
        const catBytes = catStats.reduce((s, r) => s + Number(r.size_bytes), 0)
        return (
          <section key={cat.label}>
            <SectionHeader right={`${catRows.toLocaleString()} rows · ${fmtSize(catBytes)}`}>
              {cat.icon} {cat.label}
            </SectionHeader>
            <div className="rounded-xl overflow-hidden border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface border-b border-border">
                    <th className="text-left px-4 py-2.5 font-medium text-text-muted">Table</th>
                    <th className="text-right px-4 py-2.5 font-medium text-text-muted">Rows</th>
                    <th className="text-right px-4 py-2.5 font-medium text-text-muted hidden sm:table-cell">Size</th>
                    <th className="text-right px-4 py-2.5 font-medium text-text-muted hidden md:table-cell">Status</th>
                    <th className="text-right px-4 py-2.5 font-medium text-text-muted">View</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.tables.map((tableName, i) => {
                    const row = byTable[tableName]
                    const rows = row ? Number(row.row_count) : 0
                    const schema = schemaFor(tableName)
                    return (
                      <tr key={tableName} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}>
                        <td className="px-4 py-3 font-mono text-xs text-text-secondary">{tableName}</td>
                        <td className={`px-4 py-3 text-right font-semibold tabular-nums ${rows > 0 ? 'text-text-primary' : 'text-text-muted'}`}>{rows.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-text-muted hidden sm:table-cell">{row?.size_pretty ?? '—'}</td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{
                            background: rows > 0 ? '#1a2e1a' : '#1e1e1e', color: rows > 0 ? '#4ade80' : '#555'
                          }}>
                            {rows > 0 ? 'has data' : 'empty'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => onViewTable(schema, tableName)}
                            className="text-xs px-2.5 py-1 rounded-lg border transition-all hover:border-accent hover:text-accent"
                            style={{ borderColor: '#2a2a2a', color: '#666' }}
                          >
                            View Data →
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}

// ─── Enrichment Panel ─────────────────────────────────────────────────────────

interface EnrichmentStats {
  total_facts:      number
  albums_enriched:  number
  not_found:        number
  with_cover_art:   number
  total_catalog:    number
  match_rate:       number
  fact_type_counts: Record<string, number> | null
}

interface EnrichmentSample {
  catalog_object_id: string
  item_name:         string
  release_date:      string | null
  record_label:      string | null
  genre:             string | null
  release_type:      string | null
  country:           string | null
  total_tracks:      string | null
  thumbnail_url:     string | null
  confidence:        string | null
  source_url:        string | null
}

function EnrichmentPanel({ stats, sample }: {
  stats: EnrichmentStats | null
  sample: EnrichmentSample[]
}) {
  const factTypes = stats?.fact_type_counts
    ? Object.entries(stats.fact_type_counts).sort((a, b) => b[1] - a[1])
    : []

  return (
    <div className="flex flex-col gap-6">

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Albums Enriched" value={stats?.albums_enriched?.toLocaleString() ?? '—'} sub={`of ${stats?.total_catalog?.toLocaleString() ?? '?'} catalog items`} accent />
        <StatCard label="Match Rate"      value={stats ? `${stats.match_rate}%` : '—'} sub="found on MusicBrainz" />
        <StatCard label="Total Facts"     value={stats?.total_facts?.toLocaleString() ?? '—'} sub="rows in enrichment table" />
        <StatCard label="With Cover Art"  value={stats?.with_cover_art?.toLocaleString() ?? '—'} sub="thumbnail URLs stored" />
      </div>

      {/* Fact type breakdown */}
      {factTypes.length > 0 && (
        <section>
          <SectionHeader>Fact Type Breakdown</SectionHeader>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-border">
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted">Fact Type</th>
                  <th className="text-right px-4 py-2.5 font-medium text-text-muted">Count</th>
                  <th className="px-4 py-2.5 hidden md:table-cell" />
                </tr>
              </thead>
              <tbody>
                {factTypes.map(([type, count], i) => {
                  const max = factTypes[0][1]
                  const pct = max > 0 ? (count / max) * 100 : 0
                  return (
                    <tr key={type} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}>
                      <td className="px-4 py-2.5 font-mono text-xs text-text-secondary">{type}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-text-primary">{count.toLocaleString()}</td>
                      <td className="px-4 py-2.5 hidden md:table-cell w-40">
                        <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#ff6b35' }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Sample enriched albums */}
      {sample.length > 0 && (
        <section>
          <SectionHeader right={`${sample.length} shown`}>Enriched Albums — Sample</SectionHeader>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-border">
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted w-8" />
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted">Album</th>
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted hidden md:table-cell">Label</th>
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted hidden lg:table-cell">Genre</th>
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted hidden sm:table-cell">Released</th>
                  <th className="text-center px-4 py-2.5 font-medium text-text-muted hidden md:table-cell">Tracks</th>
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted hidden lg:table-cell">Source</th>
                </tr>
              </thead>
              <tbody>
                {sample.map((row, i) => (
                  <tr key={row.catalog_object_id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}>
                    {/* Thumbnail */}
                    <td className="px-3 py-2">
                      {row.thumbnail_url ? (
                        <img
                          src={row.thumbnail_url}
                          alt=""
                          className="w-8 h-8 rounded object-cover"
                          style={{ border: '1px solid #222' }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: '#1a1a1a', border: '1px solid #222' }}>
                          <span style={{ fontSize: 14 }}>🎵</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-xs font-medium text-text-primary leading-tight" style={{ maxWidth: 240 }}>
                        {row.item_name}
                      </div>
                      {row.release_type && (
                        <span className="text-xs text-text-muted">{row.release_type}{row.country ? ` · ${row.country}` : ''}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-xs text-text-secondary">{row.record_label ?? '—'}</td>
                    <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-text-secondary">{row.genre ?? '—'}</td>
                    <td className="px-4 py-2.5 hidden sm:table-cell text-xs text-text-secondary tabular-nums">{row.release_date ?? '—'}</td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-xs text-text-secondary text-center">{row.total_tracks ?? '—'}</td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      {row.source_url ? (
                        <a href={row.source_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs hover:text-accent transition-colors" style={{ color: '#555' }}>
                          MusicBrainz →
                        </a>
                      ) : <span style={{ color: '#444', fontSize: 11 }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {sample.length === 0 && (
        <div className="rounded-xl border border-border flex items-center justify-center py-12" style={{ borderStyle: 'dashed' }}>
          <span className="text-sm text-text-muted">Enrichment still running — check back shortly</span>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'square' | 'instagram' | 'facebook' | 'tiktok' | 'catalog' | 'database' | 'db-overview' | 'enrichment'

export default function DeadWaxClient({
  squareSummary, squareTopItems, recentPayments,
  instagramMedia, instagramAccount, instagramDemographics,
  facebookPosts, dbStats, columnProfiles, catalogOverview,
  enrichmentStats, enrichmentSample,
  squareKpis, squareSalesByDate, squareSalesByFormat,
  squareSalesByCondition, squareCatalogByGenre, squareInventoryByYear,
  squareFlatFacts,
  userEmail,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('square')
  const [viewerTable, setViewerTable] = useState<{ schema: string; table: string } | null>(null)
  const router = useRouter()

  async function handleSignOut() {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/chi/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-background border-b border-border backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Image
            src="/images/deadwax-logo.avif"
            alt="Dead Wax Records"
            width={36}
            height={36}
            className="rounded-lg object-contain"
          />
          <div>
            <h1 className="font-bold text-text-primary leading-none">Dead Wax Records</h1>
            <p className="text-xs text-text-muted leading-none mt-0.5">Management Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end gap-0.5">
            <span className="text-xs text-text-muted">Outlaw Apps — Designed in Rockwall, TX</span>
            {process.env.NEXT_PUBLIC_BUILD_TIME && (
              <span className="text-text-muted" style={{ fontSize: 10, opacity: 0.5 }}>
                Updated{' '}
                {new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
                })}
              </span>
            )}
          </div>
          <button onClick={handleSignOut} className="text-xs text-text-muted hover:text-accent transition-colors">Sign out</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">

        {/* Tabs */}
        <section>
          <div className="flex gap-2 mb-6 flex-wrap">
            <TabButton active={activeTab === 'square'}      onClick={() => setActiveTab('square')}>🛒 Square</TabButton>
            <TabButton active={activeTab === 'catalog'}     onClick={() => setActiveTab('catalog')}>📦 Catalog</TabButton>
            <TabButton active={activeTab === 'instagram'}   onClick={() => setActiveTab('instagram')}>📸 Instagram</TabButton>
            <TabButton active={activeTab === 'facebook'}    onClick={() => setActiveTab('facebook')}>👥 Facebook</TabButton>
            <TabButton active={activeTab === 'tiktok'}      onClick={() => setActiveTab('tiktok')}>🎵 TikTok</TabButton>
            <TabButton active={activeTab === 'database'}    onClick={() => setActiveTab('database')}>🗄️ Database</TabButton>
            <TabButton active={activeTab === 'db-overview'} onClick={() => setActiveTab('db-overview')}>🗺️ DB Overview</TabButton>
            <TabButton active={activeTab === 'enrichment'}  onClick={() => setActiveTab('enrichment')}>✨ Enrichment</TabButton>
          </div>

          {activeTab === 'square' && (
            <SquarePanel
              kpis={squareKpis}
              salesByDate={squareSalesByDate}
              salesByFormat={squareSalesByFormat}
              salesByCondition={squareSalesByCondition}
              catalogByGenre={squareCatalogByGenre}
              inventoryByYear={squareInventoryByYear}
              flatFacts={squareFlatFacts}
            />
          )}
          {activeTab === 'catalog' && (
            catalogOverview
              ? <CatalogOverview data={catalogOverview} />
              : <p className="text-sm text-text-muted">Catalog data unavailable.</p>
          )}
          {activeTab === 'instagram' && (
            <InstagramPanel account={instagramAccount} media={instagramMedia} demographics={instagramDemographics} />
          )}
          {activeTab === 'facebook' && (
            <FacebookPanel posts={facebookPosts} />
          )}
          {activeTab === 'tiktok' && (
            <TikTokPanel />
          )}
          {activeTab === 'database' && (
            <DatabasePanel
              stats={dbStats}
              onViewTable={(schema, table) => setViewerTable({ schema, table })}
            />
          )}
          {activeTab === 'db-overview' && (
            <DatabaseMasterOverview
              profiles={columnProfiles}
              dbStats={dbStats}
              onViewTable={(schema, table) => setViewerTable({ schema, table })}
            />
          )}
          {activeTab === 'enrichment' && (
            <EnrichmentPanel stats={enrichmentStats} sample={enrichmentSample} />
          )}
        </section>

      </main>

      {/* Table Viewer overlay */}
      {viewerTable && (
        <TableViewer
          schema={viewerTable.schema}
          table={viewerTable.table}
          allTables={dbStats}
          onClose={() => setViewerTable(null)}
        />
      )}
    </div>
  )
}
