'use client'

/**
 * Dead Wax Records — Management Dashboard (Client Component)
 * Johnny Outlaw, LLC — Designed in Rockwall, TX
 */

import { useState, useMemo } from 'react'
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

interface InventoryKpis {
  total_items: number
  named_releases: number
  generic_stock: number
  items_with_sales: number
  zero_sales_items: number
  hot_items: number
  enriched_items: number
}

interface InventoryGroupedFact {
  format: string
  condition: string
  item_type: string        // 'Named Release' | 'Generic Stock'
  performance_tier: string // 'Hot' | 'Selling' | 'Zero Sales'
  rarity_label: string     // 'Ultra Rare' | 'Rare' | 'Uncommon' | 'Common' | 'Unscored'
  decade: number | null    // e.g. 1980 → 1980–1989
  item_count: number
  times_sold: number
  revenue_cents: number
}

interface InventoryGenreRow {
  genre: string
  item_count: number
  times_sold: number
  revenue_cents: number
}

interface InventoryGrowthRow {
  month: string   // 'YYYY-MM'
  item_count: number
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
  item_count?: number
  times_sold: number
  revenue_cents: number
}

interface RarityDistRow {
  rarity_label: string
  item_count: number
  avg_score: number
}

interface TopRareRow {
  catalog_object_id: string
  item_name: string
  artist_name: string | null
  thumbnail_url: string | null
  rarity_score: number
  rarity_label: string
  discogs_have: string | null
  discogs_want: string | null
  lastfm_listeners: number
  format: string | null
  condition: string | null
  times_sold: number
}

interface PopularityRow {
  catalog_object_id: string
  item_name: string
  artist_name: string | null
  thumbnail_url: string | null
  lastfm_listeners: number
  lastfm_playcount: number
  lastfm_artist_listeners: number
  rarity_score: number | null
  rarity_label: string | null
  genres: string | null
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
  discogsSample: SourceSampleRow[]
  lastfmSample: SourceSampleRow[]
  rarityDistribution: RarityDistRow[]
  popularityLeaderboard: PopularityRow[]
  topRareItems: TopRareRow[]
  squareKpis: SquareKpis | null
  squareSalesByDate: SalesByDate[]
  squareSalesByFormat: SalesByFormat[]
  squareSalesByCondition: SalesByCondition[]
  squareCatalogByGenre: CatalogByGenre[]
  squareInventoryByYear: InventoryByYear[]
  squareFlatFacts: FlatFact[]
  inventoryKpis: InventoryKpis | null
  inventoryGroupedFacts: InventoryGroupedFact[]
  inventoryGrowthByMonth: InventoryGrowthRow[]
  inventoryGenreBreakdown: InventoryGenreRow[]
  inventoryItemsByYear: InventoryByYear[]
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

// ── Viz-in-tooltip types ──────────────────────────────────────────────────────

interface HoverState {
  label: string
  metricLabel: string   // "Times Sold" | "Sales"
  metricValue: string   // formatted display value
  isRevenue: boolean
  dimType: 'format' | 'condition' | 'genre' | 'year' | 'decade' | 'popularity'
  dimValue: string | number
  mouseX: number
  mouseY: number
}

function DualBarRow({ label, val1, max1, val2, max2, fmt1, fmt2, color1 = ORANGE, color2 = PINK,
  selected, onClick, onHoverBar1, onHoverBar2, onLeaveBar }: {
  label: string; val1: number; max1: number; val2: number; max2: number
  fmt1: (v: number) => string; fmt2: (v: number) => string
  color1?: string; color2?: string; selected?: boolean; onClick?: () => void
  onHoverBar1?: (e: React.MouseEvent) => void  // orange bar hover (Times Sold)
  onHoverBar2?: (e: React.MouseEvent) => void  // pink bar hover (Sales)
  onLeaveBar?: () => void
}) {
  const pct1 = max1 > 0 ? (val1 / max1) * 100 : 0
  const pct2 = max2 > 0 ? (val2 / max2) * 100 : 0
  return (
    <div onClick={onClick} className="flex items-center gap-2 py-1 px-2 rounded transition-colors"
      style={{ cursor: onClick ? 'pointer' : 'default', background: selected ? 'rgba(255,107,53,0.1)' : 'transparent' }}>
      <span className="text-xs text-right shrink-0 truncate" style={{ width: 120, color: '#ccc' }} title={label}>{label}</span>
      <div className="flex items-center gap-1 flex-1">
        <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ background: '#1a1a1a' }}
          onMouseMove={onHoverBar1} onMouseLeave={onLeaveBar}>
          <div className="h-full rounded-sm" style={{ width: `${pct1}%`, background: color1, opacity: 0.85, pointerEvents: 'none' }} />
        </div>
        <span className="text-xs tabular-nums shrink-0" style={{ color: '#aaa', width: 40, textAlign: 'right' }}>{fmt1(val1)}</span>
      </div>
      <div className="flex items-center gap-1 flex-1">
        <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ background: '#1a1a1a' }}
          onMouseMove={onHoverBar2} onMouseLeave={onLeaveBar}>
          <div className="h-full rounded-sm" style={{ width: `${pct2}%`, background: color2, opacity: 0.85, pointerEvents: 'none' }} />
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
  popularity_tier: string
}

type ActiveFilters = {
  format: string | null
  condition: string | null
  genre: string | null
  year: number | null
  date: string | null
  dateFrom: string | null   // date range start (from dropdown)
  decade: number | null     // e.g. 1980 → 1980–1989
  popularity: string | null
}
type ExcludeKey = keyof ActiveFilters | null

function applyFilters(facts: FlatFact[], filters: ActiveFilters, exclude: ExcludeKey = null) {
  return facts.filter(f => {
    if (exclude !== 'format'     && filters.format     && f.format !== filters.format) return false
    if (exclude !== 'condition'  && filters.condition  && f.condition !== filters.condition) return false
    if (exclude !== 'popularity' && filters.popularity && f.popularity_tier !== filters.popularity) return false
    if (exclude !== 'year'       && filters.year       && f.release_year !== filters.year) return false
    // date: single-day click and range-start both use 'date' exclude key
    if (exclude !== 'date'       && filters.date       && f.sale_date !== filters.date) return false
    if (exclude !== 'date'       && filters.dateFrom   && f.sale_date < filters.dateFrom) return false
    if (exclude !== 'decade'     && filters.decade != null) {
      if (!f.release_year || f.release_year < filters.decade || f.release_year > filters.decade + 9) return false
    }
    if (exclude !== 'genre' && filters.genre) {
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

function aggByDecade(facts: FlatFact[]): { decade: number; label: string; times_sold: number; revenue_cents: number }[] {
  const m: Record<number, { times_sold: number; revenue_cents: number }> = {}
  facts.forEach(f => {
    if (!f.release_year) return
    const dec = Math.floor(f.release_year / 10) * 10
    if (!m[dec]) m[dec] = { times_sold: 0, revenue_cents: 0 }
    m[dec].times_sold++
    m[dec].revenue_cents += f.revenue_cents
  })
  return Object.entries(m).sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([dec, v]) => ({ decade: Number(dec), label: `${dec}s`, ...v }))
}

// Popularity tier order for display
const POP_ORDER = ['Iconic (1M+)', 'Popular (100K+)', 'Known (10K+)', 'Niche (<10K)', 'Unranked']

function aggByPopularity(facts: FlatFact[]): { label: string; times_sold: number; revenue_cents: number }[] {
  const m: Record<string, { times_sold: number; revenue_cents: number }> = {}
  facts.forEach(f => {
    const tier = f.popularity_tier || 'Unranked'
    if (!m[tier]) m[tier] = { times_sold: 0, revenue_cents: 0 }
    m[tier].times_sold++
    m[tier].revenue_cents += f.revenue_cents
  })
  return Object.entries(m)
    .filter(([label]) => label !== 'Unranked')   // hide Unranked — it dominates and adds no signal
    .sort((a, b) => POP_ORDER.indexOf(a[0]) - POP_ORDER.indexOf(b[0]))
    .map(([label, v]) => ({ label, ...v }))
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

// ── Viz-in-tooltip component ──────────────────────────────────────────────────

function VizTooltip({ state, dayData }: { state: HoverState; dayData: SalesByDate[] }) {
  const values = dayData.map(d => state.isRevenue ? d.total_money_cents : d.order_count)
  const maxVal  = Math.max(...values, 1)
  const color   = state.isRevenue ? PINK : ORANGE

  // clamp so tooltip doesn't run off the right edge
  const left = typeof window !== 'undefined'
    ? Math.min(state.mouseX + 18, window.innerWidth - 248)
    : state.mouseX + 18
  const top = state.mouseY - 70

  return (
    <div style={{
      position: 'fixed', left, top, zIndex: 9999, pointerEvents: 'none',
      background: '#181818', border: '1px solid #333', borderRadius: 10,
      padding: '10px 12px', width: 230,
      boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
    }}>
      {/* Header */}
      <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{state.label}</div>
      <div style={{ color, fontSize: 11, marginBottom: 8 }}>
        {state.metricLabel}: <strong>{state.metricValue}</strong>
      </div>

      {/* Mini daily chart */}
      <div style={{ color: '#555', fontSize: 9, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {state.isRevenue ? 'Revenue' : 'Times Sold'} by Day
      </div>
      {dayData.length > 0 ? (
        <>
          <svg viewBox={`0 0 ${dayData.length * 7} 44`} style={{ width: '100%', height: 52 }} preserveAspectRatio="none">
            {dayData.map((d, i) => {
              const v    = state.isRevenue ? d.total_money_cents : d.order_count
              const barH = Math.max((v / maxVal) * 40, v > 0 ? 2 : 0)
              return (
                <rect key={i} x={i * 7 + 1} y={42 - barH} width={5} height={barH}
                  fill={color} opacity={0.85} rx={1}>
                  <title>{fmtDateShort(d.sale_date)}: {state.isRevenue ? fmtDollars(v) : v.toLocaleString()}</title>
                </rect>
              )
            })}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#444', marginTop: 2 }}>
            <span>{fmtDateShort(dayData[0].sale_date)}</span>
            <span>{fmtDateShort(dayData[dayData.length - 1].sale_date)}</span>
          </div>
        </>
      ) : (
        <div style={{ color: '#444', fontSize: 10, textAlign: 'center', padding: '8px 0' }}>No daily data available</div>
      )}
    </div>
  )
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
  const [filterDecade, setFilterDecade]       = useState<number | null>(null)
  const [filterDate, setFilterDate]           = useState<string | null>(null)
  const [filterDateDays, setFilterDateDays]     = useState<number>(0) // 0 = all time
  const [filterPopularity, setFilterPopularity] = useState<string | null>(null)

  // Derive date range start from preset
  const dateFrom = useMemo(() => {
    if (!filterDateDays) return null
    const d = new Date(Date.now() - filterDateDays * 86400000)
    return d.toISOString().split('T')[0]
  }, [filterDateDays])

  const hasFilter = !!(filterFormat || filterCondition || filterGenre || filterYear || filterDecade || filterDate || filterDateDays || filterPopularity)
  const filters: ActiveFilters = {
    format: filterFormat, condition: filterCondition, genre: filterGenre,
    year: filterYear, date: filterDate, dateFrom, decade: filterDecade,
    popularity: filterPopularity,
  }

  // Dropdown option lists derived from flat facts
  const allFormats    = useMemo(() => [...new Set(flatFacts.map(f => f.format))].sort(), [flatFacts])
  const allConditions = useMemo(() => [...new Set(flatFacts.map(f => f.condition))].sort(), [flatFacts])
  const allGenres     = useMemo(() => {
    const s = new Set<string>()
    flatFacts.forEach(f => {
      if (f.genres) f.genres.split(',').map(g => g.trim()).filter(Boolean).forEach(g => s.add(g))
    })
    return [...s].sort()
  }, [flatFacts])

  // Always derive from flat facts — consistent baseline whether filtered or not.
  // Each chart excludes its own dimension so clicking a bar shows full range cross-filtered.
  const activeDateData       = aggByDate(applyFilters(flatFacts, filters, 'date'))
  const activeFormatData     = aggByFormat(applyFilters(flatFacts, filters, 'format'))
  const activeConditionData  = aggByCondition(applyFilters(flatFacts, filters, 'condition'))
  const activeGenreData      = aggByGenre(applyFilters(flatFacts, filters, 'genre'))
  const activeYearData       = aggByYear(applyFilters(flatFacts, filters, 'year'))
  const activeDecadeData     = aggByDecade(applyFilters(flatFacts, filters, 'decade'))
  const activePopData        = aggByPopularity(applyFilters(flatFacts, filters, 'popularity'))

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
  const maxDecadeSold = Math.max(...activeDecadeData.map(d => d.times_sold), 1)
  const maxDecadeRev  = Math.max(...activeDecadeData.map(d => d.revenue_cents), 1)
  const maxPopSold    = Math.max(...activePopData.map(d => d.times_sold), 1)
  const maxPopRev     = Math.max(...activePopData.map(d => d.revenue_cents), 1)

  // Filtered KPI totals — derived from flat facts when any filter is active
  const filteredFacts   = hasFilter ? applyFilters(flatFacts, filters) : null
  const filteredRevenue = filteredFacts ? filteredFacts.reduce((s, f) => s + f.revenue_cents, 0) : null
  const filteredCount   = filteredFacts ? filteredFacts.length : null

  // KPI display values
  const kpiCustomerCount = kpis?.customer_count?.toLocaleString() ?? '—'
  const kpiItemsSold     = filteredCount != null ? filteredCount.toLocaleString() : (kpis?.unique_items_sold?.toLocaleString() ?? '—')
  const kpiTotalSales    = filteredRevenue != null ? fmtDollars(filteredRevenue) : (kpis ? fmtDollars(kpis.total_sales_cents) : '—')

  const selectStyle: React.CSSProperties = {
    background: '#161616', border: '1px solid #2a2a2a', color: '#ccc',
    padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer', outline: 'none'
  }

  function clearAll() {
    setFilterFormat(null); setFilterCondition(null); setFilterGenre(null)
    setFilterYear(null); setFilterDecade(null); setFilterDate(null); setFilterDateDays(0); setFilterPopularity(null)
  }

  // ── Viz-in-tooltip state ──────────────────────────────────────────────────
  const [hoverState, setHoverState] = useState<HoverState | null>(null)

  // Tooltip mini-chart: aggregate filtered flat facts for hovered dimension by day.
  // Deps exclude mouseX/mouseY so it only recomputes when the actual dimension changes.
  const tooltipDayData = useMemo((): SalesByDate[] => {
    if (!hoverState) return []
    // Apply active filters, then further filter to hovered dimension
    let facts = applyFilters(flatFacts, filters)
    const { dimType, dimValue } = hoverState
    if (dimType === 'format')    facts = facts.filter(f => f.format === dimValue)
    if (dimType === 'condition') facts = facts.filter(f => f.condition === dimValue)
    if (dimType === 'genre')     facts = facts.filter(f => (f.genres ?? '').split(',').map(g => g.trim()).includes(String(dimValue)))
    if (dimType === 'year')      facts = facts.filter(f => f.release_year === Number(dimValue))
    if (dimType === 'decade')    facts = facts.filter(f => f.release_year != null && f.release_year >= Number(dimValue) && f.release_year <= Number(dimValue) + 9)
    return aggByDate(facts)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverState?.dimType, hoverState?.dimValue, flatFacts,
      filterFormat, filterCondition, filterGenre, filterYear, filterDecade, filterDate, filterDateDays])

  // Helper: build the two hover handlers + leave handler for a DualBarRow dimension
  function makeHoverHandlers(
    label: string, timesVal: number, revenueVal: number,
    dimType: HoverState['dimType'], dimValue: string | number
  ) {
    return {
      onHoverBar1: (e: React.MouseEvent) => setHoverState({
        label, metricLabel: 'Times Sold', metricValue: timesVal.toLocaleString(),
        isRevenue: false, dimType, dimValue, mouseX: e.clientX, mouseY: e.clientY
      }),
      onHoverBar2: (e: React.MouseEvent) => setHoverState({
        label, metricLabel: 'Sales', metricValue: fmtDollars(revenueVal),
        isRevenue: true, dimType, dimValue, mouseX: e.clientX, mouseY: e.clientY
      }),
      onLeaveBar: () => setHoverState(null),
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Filter dropdowns row ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 py-1">
        <select style={selectStyle} value={filterDateDays}
          onChange={e => { setFilterDateDays(Number(e.target.value)); setFilterDate(null) }}>
          <option value={0}>📅 All Time</option>
          <option value={7}>Last 7 Days</option>
          <option value={14}>Last 14 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={60}>Last 60 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>

        <select style={selectStyle} value={filterFormat ?? ''}
          onChange={e => setFilterFormat(e.target.value || null)}>
          <option value="">Format: All</option>
          {allFormats.map(fmt => <option key={fmt} value={fmt}>{fmt}</option>)}
        </select>

        <select style={selectStyle} value={filterGenre ?? ''}
          onChange={e => setFilterGenre(e.target.value || null)}>
          <option value="">Genre: All</option>
          {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        <select style={selectStyle} value={filterCondition ?? ''}
          onChange={e => setFilterCondition(e.target.value || null)}>
          <option value="">Condition: All</option>
          {allConditions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Stats + clear — shown when any filter is active */}
        {hasFilter && (
          <>
            <span className="text-xs px-3 py-1 rounded-lg" style={{ color: '#888', background: '#161616', border: '1px solid #222' }}>
              {filteredCount?.toLocaleString() ?? '—'} orders · {fmtDollars(filteredRevenue ?? 0)}
            </span>
            <button onClick={clearAll} className="text-xs px-3 py-1 rounded-lg hover:opacity-80 transition-opacity"
              style={{ color: ORANGE, background: '#1a0a00', border: `1px solid ${ORANGE}33` }}>
              ✕ Clear All
            </button>
          </>
        )}
      </div>

      {/* Chips for chart-click filters that aren't in the dropdowns (year, specific date, decade) */}
      {(filterDate || filterYear || filterDecade != null) && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {filterDate && (
            <button onClick={() => setFilterDate(null)}
              className="flex items-center gap-1 px-2 py-0.5 rounded hover:opacity-80"
              style={{ background: '#2a1a0a', color: ORANGE, border: `1px solid ${ORANGE}44` }}>
              Date: {fmtDateShort(filterDate)} ✕
            </button>
          )}
          {filterYear && (
            <button onClick={() => setFilterYear(null)}
              className="flex items-center gap-1 px-2 py-0.5 rounded hover:opacity-80"
              style={{ background: '#2a1a0a', color: ORANGE, border: `1px solid ${ORANGE}44` }}>
              Year: {filterYear} ✕
            </button>
          )}
          {filterDecade != null && (
            <button onClick={() => setFilterDecade(null)}
              className="flex items-center gap-1 px-2 py-0.5 rounded hover:opacity-80"
              style={{ background: '#2a1a0a', color: ORANGE, border: `1px solid ${ORANGE}44` }}>
              Decade: {filterDecade}s ✕
            </button>
          )}
        </div>
      )}

      {/* ── Row 1: KPI cards + Sales by Date ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* KPI stack */}
        <div className="flex flex-col gap-3">
          {[
            { label: 'Customer Count',    value: kpiCustomerCount, muted: hasFilter },
            { label: 'Times Sold',        value: kpiItemsSold },
            { label: 'Total Sales',       value: kpiTotalSales },
          ].map(({ label, value, muted }) => (
            <div key={label} className="rounded-xl border flex flex-col items-center justify-center py-4 gap-1"
              style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}>
              <span className="text-2xl font-bold" style={{ color: muted ? '#666' : '#fff' }}>{value}</span>
              <span className="text-xs" style={{ color: '#555' }}>
                {label}{muted ? ' (unfiltered)' : ''}
              </span>
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
              onClick={() => setFilterFormat(p => p === f.format ? null : f.format)}
              {...makeHoverHandlers(f.format, f.times_sold, f.revenue_cents, 'format', f.format)} />
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
              onClick={() => setFilterCondition(p => p === c.condition ? null : c.condition)}
              {...makeHoverHandlers(c.condition, c.times_sold, c.revenue_cents, 'condition', c.condition)} />
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
              onClick={() => setFilterGenre(p => p === g.genre ? null : g.genre)}
              {...makeHoverHandlers(g.genre, g.times_sold, g.revenue_cents, 'genre', g.genre)} />
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

        <ChartCard title="Sales by Release Year" subtitle="click year bar to filter">
          {activeYearData.length > 0 ? (
            <div className="flex flex-col gap-2">
              <div>
                <div className="text-xs mb-1" style={{ color: '#555' }}>Times Sold</div>
                <svg viewBox={`0 0 ${activeYearData.length * 8} 40`} className="w-full" style={{ height: 50 }} preserveAspectRatio="none"
                  onMouseLeave={() => setHoverState(null)}>
                  {activeYearData.map((y, i) => {
                    const barH = (y.times_sold / maxYearSold) * 36
                    return <rect key={i} x={i * 8 + 1} y={38 - barH} width={6} height={barH}
                      fill={ORANGE} opacity={filterYear === y.release_year ? 1 : 0.7} rx={1}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setFilterYear(p => p === y.release_year ? null : y.release_year)}
                      onMouseMove={e => setHoverState({ label: String(y.release_year), metricLabel: 'Times Sold',
                        metricValue: y.times_sold.toLocaleString(), isRevenue: false,
                        dimType: 'year', dimValue: y.release_year, mouseX: e.clientX, mouseY: e.clientY })} />
                  })}
                </svg>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: '#555' }}>Sales</div>
                <svg viewBox={`0 0 ${activeYearData.length * 8} 40`} className="w-full" style={{ height: 50 }} preserveAspectRatio="none"
                  onMouseLeave={() => setHoverState(null)}>
                  {activeYearData.map((y, i) => {
                    const barH = (y.revenue_cents / maxYearRev) * 36
                    return <rect key={i} x={i * 8 + 1} y={38 - barH} width={6} height={barH}
                      fill={PINK} opacity={filterYear === y.release_year ? 1 : 0.7} rx={1}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setFilterYear(p => p === y.release_year ? null : y.release_year)}
                      onMouseMove={e => setHoverState({ label: String(y.release_year), metricLabel: 'Sales',
                        metricValue: fmtDollars(y.revenue_cents), isRevenue: true,
                        dimType: 'year', dimValue: y.release_year, mouseX: e.clientX, mouseY: e.clientY })} />
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

      {/* ── Row 4: Sales by Decade ────────────────────────────────────────── */}
      <ChartCard title="Sales by Decade" subtitle="click to filter">
        {activeDecadeData.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-1 px-2" style={{ fontSize: 10, color: '#555' }}>
              <span style={{ width: 68 }} />
              <span className="flex-1 text-center">Times Sold</span>
              <span className="flex-1 text-center">Sales</span>
            </div>
            {activeDecadeData.map(d => (
              <DualBarRow key={d.decade} label={d.label}
                val1={d.times_sold} max1={maxDecadeSold} val2={d.revenue_cents} max2={maxDecadeRev}
                fmt1={v => v.toLocaleString()} fmt2={v => fmtDollars(v)}
                selected={filterDecade === d.decade}
                onClick={() => { setFilterDecade(p => p === d.decade ? null : d.decade); setFilterYear(null) }}
                {...makeHoverHandlers(d.label, d.times_sold, d.revenue_cents, 'decade', d.decade)} />
            ))}
          </>
        ) : (
          <div className="text-xs text-center py-6" style={{ color: '#444' }}>
            Enrichment still running — decade data will appear as albums are matched
          </div>
        )}
      </ChartCard>

      {/* ── Sales by Popularity ──────────────────────────────────────────── */}
      <ChartCard title="Sales by Popularity" subtitle="Last.fm listener tier · click to filter · Times Sold + Revenue">
        {activePopData.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-1 px-2" style={{ fontSize: 10, color: '#555' }}>
              <span style={{ width: 120 }} />
              <span className="flex-1 text-center">Times Sold</span>
              <span className="flex-1 text-center">Revenue</span>
            </div>
            {activePopData.map(d => (
              <DualBarRow key={d.label} label={d.label}
                val1={d.times_sold} max1={maxPopSold} val2={d.revenue_cents} max2={maxPopRev}
                fmt1={v => v.toLocaleString()} fmt2={v => fmtDollars(v)}
                color1={ORANGE} color2={PINK}
                selected={filterPopularity === d.label}
                onClick={() => setFilterPopularity(p => p === d.label ? null : d.label)}
                {...makeHoverHandlers(d.label, d.times_sold, d.revenue_cents, 'popularity', d.label)} />
            ))}
          </>
        ) : (
          <div className="text-xs text-center py-6" style={{ color: '#444' }}>
            Popularity data still enriching — appears as Last.fm data fills in
          </div>
        )}
      </ChartCard>

      {/* ── Viz-in-tooltip (portal to body coords) ──────────────────────── */}
      {hoverState && <VizTooltip state={hoverState} dayData={tooltipDayData} />}

    </div>
  )
}

// ─── Inventory Panel ──────────────────────────────────────────────────────────

const BLUE = '#4dabf7'

// Inventory filter type — works with pre-aggregated grouped facts
type InvFilters = {
  format: string | null
  condition: string | null
  item_type: string | null
  tier: string | null
  decade: number | null
}
type InvExclude = keyof InvFilters | null

function applyInvFilters(facts: InventoryGroupedFact[], f: InvFilters, exclude: InvExclude = null): InventoryGroupedFact[] {
  return facts.filter(row => {
    if (exclude !== 'format'    && f.format    && row.format            !== f.format)    return false
    if (exclude !== 'condition' && f.condition && row.condition         !== f.condition) return false
    if (exclude !== 'item_type' && f.item_type && row.item_type         !== f.item_type) return false
    if (exclude !== 'tier'      && f.tier      && row.performance_tier  !== f.tier)      return false
    if (exclude !== 'decade'    && f.decade != null && row.decade       !== f.decade)    return false
    return true
  })
}

// Aggregation helpers for inventory — SUM(item_count) because each row represents many items
type InvByDim = { label: string; item_count: number; times_sold: number; revenue_cents: number }

function invAggBy(facts: InventoryGroupedFact[], key: keyof InventoryGroupedFact): InvByDim[] {
  const m: Record<string, { item_count: number; times_sold: number; revenue_cents: number }> = {}
  facts.forEach(f => {
    const v = String(f[key] ?? 'Unknown')
    if (!m[v]) m[v] = { item_count: 0, times_sold: 0, revenue_cents: 0 }
    m[v].item_count   += f.item_count
    m[v].times_sold   += f.times_sold
    m[v].revenue_cents += f.revenue_cents
  })
  return Object.entries(m)
    .sort((a, b) => b[1].item_count - a[1].item_count)
    .map(([label, v]) => ({ label, ...v }))
}

function invAggByDecade(facts: InventoryGroupedFact[]): InvByDim[] {
  const m: Record<number, { item_count: number; times_sold: number; revenue_cents: number }> = {}
  facts.forEach(f => {
    if (f.decade == null) return
    if (!m[f.decade]) m[f.decade] = { item_count: 0, times_sold: 0, revenue_cents: 0 }
    m[f.decade].item_count   += f.item_count
    m[f.decade].times_sold   += f.times_sold
    m[f.decade].revenue_cents += f.revenue_cents
  })
  return Object.entries(m)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([dec, v]) => ({ label: `${dec}s`, ...v }))
}

const RARITY_ORDER = ['Ultra Rare', 'Rare', 'Uncommon', 'Common']

function invAggByRarity(facts: InventoryGroupedFact[]): InvByDim[] {
  const m: Record<string, { item_count: number; times_sold: number; revenue_cents: number }> = {}
  facts.forEach(f => {
    const r = f.rarity_label ?? 'Unscored'
    if (r === 'Unscored') return
    if (!m[r]) m[r] = { item_count: 0, times_sold: 0, revenue_cents: 0 }
    m[r].item_count   += f.item_count
    m[r].times_sold   += f.times_sold
    m[r].revenue_cents += f.revenue_cents
  })
  return Object.entries(m)
    .sort((a, b) => (RARITY_ORDER.indexOf(a[0]) ?? 99) - (RARITY_ORDER.indexOf(b[0]) ?? 99))
    .map(([label, v]) => ({ label, ...v }))
}

function InventoryPanel({ kpis, groupedFacts, growthByMonth, genreBreakdown, inventoryByYear }: {
  kpis: InventoryKpis | null
  groupedFacts: InventoryGroupedFact[]
  growthByMonth: InventoryGrowthRow[]
  genreBreakdown: InventoryGenreRow[]
  inventoryByYear: InventoryByYear[]
}) {
  const [filterFormat,  setFilterFormat]  = useState<string | null>(null)
  const [filterCond,    setFilterCond]    = useState<string | null>(null)
  const [filterType,    setFilterType]    = useState<string | null>(null)
  const [filterTier,    setFilterTier]    = useState<string | null>(null)
  const [filterDecade,  setFilterDecade]  = useState<number | null>(null)

  const hasFilter = !!(filterFormat || filterCond || filterType || filterTier || filterDecade != null)
  const invF: InvFilters = {
    format: filterFormat, condition: filterCond, item_type: filterType,
    tier: filterTier, decade: filterDecade,
  }

  // Dropdown option lists derived from grouped facts
  const allFormats    = useMemo(() => [...new Set(groupedFacts.map(f => f.format))].sort(), [groupedFacts])
  const allConditions = useMemo(() => [...new Set(groupedFacts.map(f => f.condition))].sort(), [groupedFacts])
  const allTiers      = useMemo(() => ['Hot', 'Selling', 'Zero Sales'], [])

  // Chart data — each chart excludes its own dimension for cross-filter
  const fmtData    = invAggBy(applyInvFilters(groupedFacts, invF, 'format'),    'format')
  const condData   = invAggBy(applyInvFilters(groupedFacts, invF, 'condition'), 'condition')
  const typeData   = invAggBy(applyInvFilters(groupedFacts, invF, 'item_type'), 'item_type')
  const tierData   = invAggBy(applyInvFilters(groupedFacts, invF, 'tier'),      'performance_tier')
  const decadeData = invAggByDecade(applyInvFilters(groupedFacts, invF, 'decade'))
  const rarityData = invAggByRarity(applyInvFilters(groupedFacts, invF))

  // Genre + year + growth use pre-aggregated server data (no client cross-filter)
  const genreData  = useMemo(() => genreBreakdown.slice(0, 20).map(g => ({
    label: g.genre, item_count: g.item_count, times_sold: g.times_sold, revenue_cents: g.revenue_cents
  })), [genreBreakdown])
  const yearData   = useMemo(() => inventoryByYear.map(y => ({
    year: y.release_year, label: String(y.release_year),
    item_count: y.item_count ?? 0,
    times_sold: y.times_sold, revenue_cents: y.revenue_cents
  })), [inventoryByYear])
  const growthData = useMemo(() => growthByMonth.map(g => ({
    month: g.month, count: Number(g.item_count)
  })), [growthByMonth])

  // Chart maxes
  const maxFmt     = Math.max(...fmtData.map(d => d.item_count), 1)
  const maxFmtSold = Math.max(...fmtData.map(d => d.times_sold), 1)
  const maxCond    = Math.max(...condData.map(d => d.item_count), 1)
  const maxCondS   = Math.max(...condData.map(d => d.times_sold), 1)
  const maxType    = Math.max(...typeData.map(d => d.item_count), 1)
  const maxTypeS   = Math.max(...typeData.map(d => d.times_sold), 1)
  const maxTier    = Math.max(...tierData.map(d => d.item_count), 1)
  const maxGenre   = Math.max(...genreData.map(d => d.item_count), 1)
  const maxGenreS  = Math.max(...genreData.map(d => d.times_sold), 1)
  const maxDecade  = Math.max(...decadeData.map(d => d.item_count), 1)
  const maxDecadeS = Math.max(...decadeData.map(d => d.times_sold), 1)
  const maxYear    = Math.max(...yearData.map(d => d.item_count), 1)
  const maxGrowth  = Math.max(...growthData.map(d => d.count), 1)
  const maxRarity  = Math.max(...rarityData.map(d => d.item_count), 1)
  const maxRarityS = Math.max(...rarityData.map(d => d.times_sold), 1)

  // Filtered KPI totals (sum item_count from grouped rows)
  const filteredFacts = hasFilter ? applyInvFilters(groupedFacts, invF) : null
  const filteredCount = filteredFacts ? filteredFacts.reduce((s, r) => s + r.item_count, 0) : null

  // Live KPI values
  const kpiTotal    = filteredCount != null ? filteredCount.toLocaleString() : (kpis?.total_items?.toLocaleString() ?? '—')
  const kpiNamed    = filteredCount != null
    ? filteredFacts!.filter(f => f.item_type === 'Named Release').reduce((s, r) => s + r.item_count, 0).toLocaleString()
    : (kpis?.named_releases?.toLocaleString() ?? '—')
  const kpiUnsold   = filteredCount != null
    ? filteredFacts!.filter(f => f.times_sold === 0).reduce((s, r) => s + r.item_count, 0).toLocaleString()
    : (kpis?.zero_sales_items?.toLocaleString() ?? '—')
  const kpiEnriched = kpis?.enriched_items?.toLocaleString() ?? '—'

  const invSelectStyle: React.CSSProperties = {
    background: '#161616', border: '1px solid #2a2a2a', color: '#ccc',
    padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer', outline: 'none'
  }

  function clearAll() {
    setFilterFormat(null); setFilterCond(null); setFilterType(null)
    setFilterTier(null); setFilterDecade(null)
  }

  // Tier colors
  const tierColor = (t: string) => t === 'Hot' ? '#ff6b35' : t === 'Selling' ? BLUE : '#555'

  return (
    <div className="flex flex-col gap-4">

      {/* ── Sub-tab nav ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b pb-3" style={{ borderColor: '#1e1e1e' }}>
        <button className="px-4 py-1.5 text-sm font-semibold rounded-lg" style={{ background: '#ff6b35', color: '#fff' }}>
          📦 Inventory
        </button>
      </div>

      {/* ── Filter dropdowns ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 py-1">
        <select style={invSelectStyle} value={filterFormat ?? ''} onChange={e => setFilterFormat(e.target.value || null)}>
          <option value="">Format: All</option>
          {allFormats.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select style={invSelectStyle} value={filterCond ?? ''} onChange={e => setFilterCond(e.target.value || null)}>
          <option value="">Condition: All</option>
          {allConditions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={invSelectStyle} value={filterType ?? ''} onChange={e => setFilterType(e.target.value || null)}>
          <option value="">Type: All</option>
          <option value="Named Release">Named Release</option>
          <option value="Generic Stock">Generic Stock</option>
        </select>
        <select style={invSelectStyle} value={filterTier ?? ''} onChange={e => setFilterTier(e.target.value || null)}>
          <option value="">Performance: All</option>
          {allTiers.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {hasFilter && (
          <>
            <span className="text-xs px-3 py-1 rounded-lg" style={{ color: '#888', background: '#161616', border: '1px solid #222' }}>
              {filteredCount?.toLocaleString() ?? '—'} items
            </span>
            <button onClick={clearAll} className="text-xs px-3 py-1 rounded-lg hover:opacity-80"
              style={{ color: ORANGE, background: '#1a0a00', border: `1px solid ${ORANGE}33` }}>
              ✕ Clear All
            </button>
          </>
        )}
      </div>

      {/* Decade chip from chart click */}
      {filterDecade != null && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button onClick={() => setFilterDecade(null)} className="flex items-center gap-1 px-2 py-0.5 rounded hover:opacity-80"
            style={{ background: '#0a1a2a', color: BLUE, border: `1px solid ${BLUE}44` }}>
            Decade: {filterDecade}s ✕
          </button>
        </div>
      )}

      {/* ── Row 1: KPI cards + Catalog Growth ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* KPI stack */}
        <div className="flex flex-col gap-3">
          {[
            { label: 'Total Items',     value: kpiTotal,    muted: false },
            { label: 'Named Releases',  value: kpiNamed,    muted: false },
            { label: 'Zero Sales',      value: kpiUnsold,   muted: false },
            { label: 'Enriched Items',  value: kpiEnriched, muted: hasFilter },
          ].map(({ label, value, muted }) => (
            <div key={label} className="rounded-xl border flex flex-col items-center justify-center py-3 gap-1"
              style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}>
              <span className="text-xl font-bold" style={{ color: muted ? '#555' : '#fff' }}>{value}</span>
              <span className="text-xs" style={{ color: '#555' }}>{label}{muted ? ' (global)' : ''}</span>
            </div>
          ))}
        </div>

        {/* Catalog Growth by Month */}
        <div className="lg:col-span-2">
          <ChartCard title="Catalog Growth" subtitle="items added to Square catalog by month">
            {growthData.length > 0 ? (
              <div className="flex flex-col gap-1">
                <svg viewBox={`0 0 ${growthData.length * 18} 80`} className="w-full" style={{ height: 100 }} preserveAspectRatio="none">
                  {growthData.map((d, i) => {
                    const barH = (d.count / maxGrowth) * 70
                    return (
                      <rect key={i} x={i * 18 + 2} y={78 - barH} width={14} height={barH}
                        fill={BLUE} opacity={0.75} rx={1}>
                        <title>{d.month}: {d.count} items added</title>
                      </rect>
                    )
                  })}
                </svg>
                <div className="flex justify-between px-1" style={{ fontSize: 9, color: '#444' }}>
                  {growthData.filter((_, i) => i % Math.max(Math.floor(growthData.length / 8), 1) === 0 || i === growthData.length - 1)
                    .map(d => <span key={d.month}>{d.month.slice(0, 7)}</span>)}
                </div>
              </div>
            ) : (
              <div className="text-xs text-center py-8" style={{ color: '#444' }}>No catalog date data</div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* ── Row 2: Format + Condition ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Inventory by Format" subtitle="click to filter · blue = catalog count · orange = times sold">
          <div className="flex items-center gap-2 mb-1 px-2" style={{ fontSize: 10, color: '#555' }}>
            <span style={{ width: 120 }} />
            <span className="flex-1 text-center">In Catalog</span>
            <span className="flex-1 text-center">Times Sold</span>
          </div>
          {fmtData.map(d => (
            <DualBarRow key={d.label} label={d.label}
              val1={d.item_count} max1={maxFmt} val2={d.times_sold} max2={maxFmtSold}
              color1={BLUE} color2={ORANGE}
              fmt1={v => v.toLocaleString()} fmt2={v => v.toLocaleString()}
              selected={filterFormat === d.label}
              onClick={() => setFilterFormat(p => p === d.label ? null : d.label)} />
          ))}
        </ChartCard>

        <ChartCard title="Inventory by Condition" subtitle="click to filter">
          <div className="flex items-center gap-2 mb-1 px-2" style={{ fontSize: 10, color: '#555' }}>
            <span style={{ width: 120 }} />
            <span className="flex-1 text-center">In Catalog</span>
            <span className="flex-1 text-center">Times Sold</span>
          </div>
          {condData.map(d => (
            <DualBarRow key={d.label} label={d.label}
              val1={d.item_count} max1={maxCond} val2={d.times_sold} max2={maxCondS}
              color1={BLUE} color2={ORANGE}
              fmt1={v => v.toLocaleString()} fmt2={v => v.toLocaleString()}
              selected={filterCond === d.label}
              onClick={() => setFilterCond(p => p === d.label ? null : d.label)} />
          ))}
        </ChartCard>
      </div>

      {/* ── Row 3: Item Type + Performance Tier ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Inventory by Type" subtitle="Named Releases vs. Generic Stock · click to filter">
          <div className="flex items-center gap-2 mb-1 px-2" style={{ fontSize: 10, color: '#555' }}>
            <span style={{ width: 120 }} />
            <span className="flex-1 text-center">In Catalog</span>
            <span className="flex-1 text-center">Times Sold</span>
          </div>
          {typeData.map(d => (
            <DualBarRow key={d.label} label={d.label}
              val1={d.item_count} max1={maxType} val2={d.times_sold} max2={maxTypeS}
              color1={BLUE} color2={ORANGE}
              fmt1={v => v.toLocaleString()} fmt2={v => v.toLocaleString()}
              selected={filterType === d.label}
              onClick={() => setFilterType(p => p === d.label ? null : d.label)} />
          ))}
        </ChartCard>

        <ChartCard title="Performance Tier" subtitle="click to filter">
          <div className="flex flex-col gap-3 py-2">
            {tierData.map(d => {
              const pct = maxTier > 0 ? (d.item_count / maxTier) * 100 : 0
              const col = tierColor(d.label)
              const isSelected = filterTier === d.label
              return (
                <div key={d.label} onClick={() => setFilterTier(p => p === d.label ? null : d.label)}
                  className="flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: isSelected ? `${col}15` : 'transparent' }}>
                  <span className="text-xs shrink-0" style={{ width: 80, color: col, fontWeight: 600 }}>{d.label}</span>
                  <div className="flex-1 h-5 rounded-sm overflow-hidden" style={{ background: '#1a1a1a' }}>
                    <div className="h-full rounded-sm transition-all" style={{ width: `${pct}%`, background: col, opacity: 0.8 }} />
                  </div>
                  <span className="text-xs tabular-nums shrink-0" style={{ color: '#aaa', width: 52, textAlign: 'right' }}>
                    {d.item_count.toLocaleString()}
                  </span>
                  <span className="text-xs tabular-nums shrink-0" style={{ color: '#555', width: 60, textAlign: 'right' }}>
                    {d.item_count > 0 ? `${Math.round((d.item_count / (filteredCount ?? kpis?.total_items ?? 1)) * 100)}%` : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </ChartCard>
      </div>

      {/* ── Row 4: Genre + Decade ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Catalog by Genre" subtitle="from enrichment data">
          <div className="flex items-center gap-2 mb-1 px-2" style={{ fontSize: 10, color: '#555' }}>
            <span style={{ width: 120 }} />
            <span className="flex-1 text-center">In Catalog</span>
            <span className="flex-1 text-center">Times Sold</span>
          </div>
          {genreData.length > 0 ? genreData.slice(0, 15).map(d => (
            <DualBarRow key={d.label} label={d.label}
              val1={d.item_count} max1={maxGenre} val2={d.times_sold} max2={maxGenreS}
              color1={BLUE} color2={ORANGE}
              fmt1={v => v.toLocaleString()} fmt2={v => v.toLocaleString()}
              selected={false}
              onClick={() => {}} />
          )) : (
            <div className="text-xs text-center py-8" style={{ color: '#444' }}>
              Enrichment still running — genre data will appear as albums are matched
            </div>
          )}
        </ChartCard>

        <ChartCard title="Catalog by Decade" subtitle="from enrichment data · click to filter">
          {decadeData.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-1 px-2" style={{ fontSize: 10, color: '#555' }}>
                <span style={{ width: 68 }} />
                <span className="flex-1 text-center">In Catalog</span>
                <span className="flex-1 text-center">Times Sold</span>
              </div>
              {decadeData.map(d => {
                const dec = parseInt(d.label)
                return (
                  <DualBarRow key={d.label} label={d.label}
                    val1={d.item_count} max1={maxDecade} val2={d.times_sold} max2={maxDecadeS}
                    color1={BLUE} color2={ORANGE}
                    fmt1={v => v.toLocaleString()} fmt2={v => v.toLocaleString()}
                    selected={filterDecade === dec}
                    onClick={() => { setFilterDecade(p => p === dec ? null : dec) }} />
                )
              })}
            </>
          ) : (
            <div className="text-xs text-center py-8" style={{ color: '#444' }}>
              Enrichment still running — decade data will appear as albums are matched
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Inventory by Rarity ──────────────────────────────────────── */}
      {rarityData.length > 0 && (
        <ChartCard title="Inventory by Rarity" subtitle="Discogs-scored items · In Catalog + Times Sold">
          <>
            <div className="flex items-center gap-2 mb-1 px-2" style={{ fontSize: 10, color: '#555' }}>
              <span style={{ width: 120 }} />
              <span className="flex-1 text-center">In Catalog</span>
              <span className="flex-1 text-center">Times Sold</span>
            </div>
            {rarityData.map(d => (
              <DualBarRow key={d.label} label={d.label}
                val1={d.item_count} max1={maxRarity} val2={d.times_sold} max2={maxRarityS}
                color1={BLUE} color2={ORANGE}
                fmt1={v => v.toLocaleString()} fmt2={v => v.toLocaleString()} />
            ))}
          </>
        </ChartCard>
      )}

      {/* ── Row 5: Catalog by Release Year ───────────────────────────── */}
      {yearData.length > 0 && (
        <ChartCard title="Catalog by Release Year" subtitle="items in catalog by release year">
          <div className="flex flex-col gap-2">
            <div>
              <div className="text-xs mb-1" style={{ color: '#555' }}>In Catalog</div>
              <svg viewBox={`0 0 ${yearData.length * 8} 40`} className="w-full" style={{ height: 50 }} preserveAspectRatio="none">
                {yearData.map((y, i) => {
                  const barH = (y.item_count / maxYear) * 36
                  return (
                    <rect key={i} x={i * 8 + 1} y={38 - barH} width={6} height={barH}
                      fill={BLUE} opacity={0.65} rx={1}>
                      <title>{y.year}: {y.item_count} items</title>
                    </rect>
                  )
                })}
              </svg>
            </div>
            <div className="flex justify-between" style={{ fontSize: 9, color: '#444' }}>
              {[yearData[0], ...yearData.filter((_, i) => i % Math.max(Math.floor(yearData.length / 5), 1) === 0),
                yearData[yearData.length - 1]]
                .filter((v, i, a) => a.findIndex(x => x.year === v.year) === i)
                .map(y => <span key={y.year}>{y.year}</span>)}
            </div>
          </div>
        </ChartCard>
      )}

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

interface SourceSampleRow {
  catalog_object_id: string
  item_name:         string
  artist_name:       string | null
  source:            string
  discogs_price:     string | null
  discogs_rating:    string | null
  discogs_have:      string | null
  discogs_want:      string | null
  discogs_style:     string | null
  discogs_genre:     string | null
  discogs_cover_url: string | null
  lastfm_genre:      string | null
  mb_genre:          string | null
  mb_label:          string | null
  mb_year:           string | null
  mb_type:           string | null
  thumbnail_url:     string | null
}

interface EnrichmentStats {
  total_facts:      number
  albums_enriched:  number
  not_found:        number
  with_cover_art:   number
  total_catalog:    number
  match_rate:       number
  fact_type_counts: Record<string, number> | null
  source_breakdown: Record<string, { total_facts: number; unique_items: number }> | null
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

function fmtListeners(n: number | null | undefined): string {
  if (n == null || n === 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

function EnrichmentPanel({ stats, sample, discogsSample, lastfmSample, rarityDistribution, popularityLeaderboard }: {
  stats: EnrichmentStats | null
  sample: EnrichmentSample[]
  discogsSample: SourceSampleRow[]
  lastfmSample: SourceSampleRow[]
  rarityDistribution: RarityDistRow[]
  popularityLeaderboard: PopularityRow[]
}) {
  const factTypes = stats?.fact_type_counts
    ? Object.entries(stats.fact_type_counts).sort((a, b) => b[1] - a[1])
    : []

  const sources = stats?.source_breakdown
    ? Object.entries(stats.source_breakdown).sort((a, b) => b[1].total_facts - a[1].total_facts)
    : []

  const sourceColors: Record<string, string> = {
    musicbrainz:     '#ba11ff',
    coverartarchive: '#0ea5e9',
    discogs:         '#ff6b35',
    lastfm:          '#d94343',
  }

  const rarityConfig: Record<string, { bg: string; text: string; icon: string }> = {
    'Ultra Rare': { bg: '#78350f', text: '#fde68a', icon: '★' },
    'Rare':       { bg: '#4c1d95', text: '#ddd6fe', icon: '◆' },
    'Uncommon':   { bg: '#1e3a5f', text: '#93c5fd', icon: '▲' },
    'Common':     { bg: '#1f2937', text: '#9ca3af', icon: '·' },
    'Unscored':   { bg: '#111827', text: '#6b7280', icon: '' },
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Items Enriched" value={stats?.albums_enriched?.toLocaleString() ?? '—'} sub={`of ${stats?.total_catalog?.toLocaleString() ?? '?'} catalog items`} accent />
        <StatCard label="Match Rate"      value={stats ? `${stats.match_rate}%` : '—'} sub="across all sources" />
        <StatCard label="Total Facts"     value={stats?.total_facts?.toLocaleString() ?? '—'} sub="rows in enrichment table" />
        <StatCard label="With Cover Art"  value={stats?.with_cover_art?.toLocaleString() ?? '—'} sub="from Discogs + CoverArt" />
      </div>

      {/* Rarity distribution */}
      {rarityDistribution.length > 0 && (
        <section>
          <SectionHeader>Catalog Rarity Distribution</SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {rarityDistribution.filter(r => r.rarity_label !== 'Unscored').map(row => {
              const cfg = rarityConfig[row.rarity_label] ?? rarityConfig['Common']
              return (
                <div key={row.rarity_label} className="rounded-xl border border-border p-4" style={{ borderLeftWidth: 3, borderLeftColor: cfg.bg === '#1f2937' ? '#374151' : cfg.bg }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    {cfg.icon && <span style={{ color: cfg.text, fontSize: 11 }}>{cfg.icon}</span>}
                    <div className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.text }}>{row.rarity_label}</div>
                  </div>
                  <div className="text-2xl font-bold text-text-primary">{Number(row.item_count).toLocaleString()}</div>
                  <div className="text-xs text-text-muted mt-0.5">items · avg score {row.avg_score}</div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Popularity leaderboard */}
      {popularityLeaderboard.length > 0 && (
        <section>
          <SectionHeader right={`top ${popularityLeaderboard.length} by Last.fm listeners`}>
            <span style={{ color: '#d94343' }}>Last.fm</span> — Popularity Leaderboard
          </SectionHeader>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-border">
                  <th className="text-left px-3 py-2.5 font-medium text-text-muted w-8">#</th>
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted w-8" />
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted">Album</th>
                  <th className="text-right px-4 py-2.5 font-medium text-text-muted">Listeners</th>
                  <th className="text-right px-4 py-2.5 font-medium text-text-muted hidden md:table-cell">Plays</th>
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted hidden lg:table-cell">Rarity</th>
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted hidden xl:table-cell">Genres</th>
                </tr>
              </thead>
              <tbody>
                {popularityLeaderboard.map((row, i) => {
                  const cfg = row.rarity_label ? (rarityConfig[row.rarity_label] ?? rarityConfig['Common']) : null
                  return (
                    <tr key={row.catalog_object_id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}>
                      <td className="px-3 py-2 text-xs font-bold tabular-nums" style={{ color: i < 3 ? '#f59e0b' : '#555' }}>{i + 1}</td>
                      <td className="px-2 py-2">
                        {row.thumbnail_url ? (
                          <img src={row.thumbnail_url} alt="" className="w-8 h-8 rounded object-cover" style={{ border: '1px solid #222' }} />
                        ) : (
                          <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: '#1a1a1a', border: '1px solid #222' }}>
                            <span style={{ fontSize: 12 }}>🎵</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {row.artist_name && (
                          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#ff6b35', fontSize: 10 }}>{row.artist_name}</div>
                        )}
                        <div className="text-xs font-medium text-text-primary leading-tight" style={{ maxWidth: 260 }}>{row.item_name}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="font-bold tabular-nums text-sm" style={{ color: '#d94343' }}>{fmtListeners(row.lastfm_listeners)}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right hidden md:table-cell text-xs text-text-muted tabular-nums">
                        {fmtListeners(row.lastfm_playcount)}
                      </td>
                      <td className="px-4 py-2.5 hidden lg:table-cell">
                        {cfg && row.rarity_label && (row.rarity_score ?? 0) >= 25 ? (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.text }}>
                            {cfg.icon} {row.rarity_label}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">{row.rarity_score ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 hidden xl:table-cell">
                        {row.genres ? (
                          <div className="flex gap-1 flex-wrap">
                            {row.genres.split(', ').slice(0, 2).map(g => (
                              <span key={g} className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#1a0d0d', color: '#d94343', fontSize: 10 }}>{g}</span>
                            ))}
                          </div>
                        ) : <span className="text-text-muted text-xs">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Source breakdown cards */}
      {sources.length > 0 && (
        <section>
          <SectionHeader>Enrichment Sources</SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sources.map(([source, data]) => (
              <div key={source} className="rounded-xl border border-border p-4" style={{ borderLeftWidth: 3, borderLeftColor: sourceColors[source] ?? '#555' }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: sourceColors[source] ?? '#888' }}>
                  {source === 'coverartarchive' ? 'CoverArt' : source.charAt(0).toUpperCase() + source.slice(1)}
                </div>
                <div className="text-lg font-bold text-text-primary">{data.unique_items.toLocaleString()}</div>
                <div className="text-xs text-text-muted">items · {data.total_facts.toLocaleString()} facts</div>
              </div>
            ))}
          </div>
        </section>
      )}

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

      {/* Discogs sample — marketplace pricing, ratings, community stats */}
      {discogsSample.length > 0 && (
        <section>
          <SectionHeader right={`${discogsSample.length} shown`}>
            <span style={{ color: '#ff6b35' }}>Discogs</span> — Marketplace Pricing &amp; Ratings
          </SectionHeader>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-border">
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted w-8" />
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted">Album</th>
                  <th className="text-right px-4 py-2.5 font-medium text-text-muted">Lowest $</th>
                  <th className="text-center px-4 py-2.5 font-medium text-text-muted">Rating</th>
                  <th className="text-right px-4 py-2.5 font-medium text-text-muted hidden md:table-cell">Have</th>
                  <th className="text-right px-4 py-2.5 font-medium text-text-muted hidden md:table-cell">Want</th>
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted hidden lg:table-cell">Styles</th>
                </tr>
              </thead>
              <tbody>
                {discogsSample.map((row, i) => {
                  const rating = row.discogs_rating ? parseFloat(row.discogs_rating) : 0
                  const price = row.discogs_price ? parseFloat(row.discogs_price) : 0
                  return (
                    <tr key={row.catalog_object_id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}>
                      <td className="px-3 py-2">
                        {row.thumbnail_url ? (
                          <img src={row.thumbnail_url} alt="" className="w-8 h-8 rounded object-cover" style={{ border: '1px solid #222' }} />
                        ) : (
                          <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: '#1a1a1a', border: '1px solid #222' }}>
                            <span style={{ fontSize: 14 }}>🎵</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {row.artist_name && (
                          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#ff6b35', fontSize: 10 }}>{row.artist_name}</div>
                        )}
                        <div className="text-xs font-medium text-text-primary leading-tight" style={{ maxWidth: 280 }}>
                          {row.item_name}
                        </div>
                        {row.mb_year && <span className="text-xs text-text-muted">{row.mb_year}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {price > 0 ? (
                          <span className="font-bold tabular-nums" style={{ color: '#059669' }}>${price.toFixed(2)}</span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {rating > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <span style={{ color: '#f59e0b', fontSize: 12 }}>{'★'.repeat(Math.round(rating))}</span>
                            <span className="text-xs text-text-muted tabular-nums">{rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right hidden md:table-cell text-xs text-text-secondary tabular-nums">{row.discogs_have ? parseInt(row.discogs_have).toLocaleString() : '—'}</td>
                      <td className="px-4 py-2.5 text-right hidden md:table-cell text-xs tabular-nums" style={{ color: row.discogs_want && parseInt(row.discogs_want) > 50 ? '#f59e0b' : undefined }}>
                        {row.discogs_want ? parseInt(row.discogs_want).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-2.5 hidden lg:table-cell">
                        {row.discogs_style ? (
                          <div className="flex gap-1 flex-wrap">
                            {row.discogs_style.split(', ').slice(0, 3).map(s => (
                              <span key={s} className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#1a1a2e', color: '#7c8aff', fontSize: 10 }}>{s}</span>
                            ))}
                          </div>
                        ) : <span className="text-text-muted text-xs">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Last.fm sample — genre tags */}
      {lastfmSample.length > 0 && (
        <section>
          <SectionHeader right={`${lastfmSample.length} shown`}>
            <span style={{ color: '#d94343' }}>Last.fm</span> — Genre Tags
          </SectionHeader>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-border">
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted w-8" />
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted">Album</th>
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted">Last.fm Genres</th>
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted hidden md:table-cell">MB Genre</th>
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted hidden lg:table-cell">Label</th>
                </tr>
              </thead>
              <tbody>
                {lastfmSample.map((row, i) => (
                  <tr key={row.catalog_object_id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}>
                    <td className="px-3 py-2">
                      {row.thumbnail_url ? (
                        <img src={row.thumbnail_url} alt="" className="w-8 h-8 rounded object-cover" style={{ border: '1px solid #222' }} />
                      ) : (
                        <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: '#1a1a1a', border: '1px solid #222' }}>
                          <span style={{ fontSize: 14 }}>🎵</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.artist_name && (
                        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#ff6b35', fontSize: 10 }}>{row.artist_name}</div>
                      )}
                      <div className="text-xs font-medium text-text-primary leading-tight" style={{ maxWidth: 240 }}>
                        {row.item_name}
                      </div>
                      {row.mb_year && <span className="text-xs text-text-muted">{row.mb_year}</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.lastfm_genre ? (
                        <div className="flex gap-1 flex-wrap">
                          {row.lastfm_genre.split(', ').slice(0, 5).map(g => (
                            <span key={g} className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#1a0d0d', color: '#d94343', fontSize: 10 }}>{g}</span>
                          ))}
                        </div>
                      ) : <span className="text-text-muted text-xs">—</span>}
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-xs text-text-secondary">{row.mb_genre ?? '—'}</td>
                    <td className="px-4 py-2.5 hidden lg:table-cell text-xs text-text-secondary">{row.mb_label ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {sample.length === 0 && discogsSample.length === 0 && lastfmSample.length === 0 && (
        <div className="rounded-xl border border-border flex items-center justify-center py-12" style={{ borderStyle: 'dashed' }}>
          <span className="text-sm text-text-muted">Enrichment still running — check back shortly</span>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Rarity Section (shared between Inventory + Catalog tabs) ────────────────

function RaritySection({ rarityDistribution, topRareItems }: {
  rarityDistribution: RarityDistRow[]
  topRareItems: TopRareRow[]
}) {
  const RARITY_CFG: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    'Ultra Rare': { bg: '#78350f', text: '#fde68a', border: '#92400e', icon: '★' },
    'Rare':       { bg: '#4c1d95', text: '#ddd6fe', border: '#5b21b6', icon: '◆' },
    'Uncommon':   { bg: '#1e3a5f', text: '#93c5fd', border: '#1e40af', icon: '▲' },
    'Common':     { bg: '#1f2937', text: '#9ca3af', border: '#374151', icon: '·' },
  }

  const scoredRows = rarityDistribution.filter(r => r.rarity_label !== 'Unscored')
  const totalScored = scoredRows.reduce((s, r) => s + Number(r.item_count), 0)

  return (
    <div className="flex flex-col gap-4 mt-6">

      {/* Distribution cards */}
      {scoredRows.length > 0 && (
        <section>
          <SectionHeader right={`${totalScored.toLocaleString()} scored items`}>Catalog Rarity Distribution</SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {scoredRows.map(row => {
              const cfg = RARITY_CFG[row.rarity_label] ?? RARITY_CFG['Common']
              const pct = totalScored > 0 ? ((Number(row.item_count) / totalScored) * 100).toFixed(1) : '0'
              return (
                <div key={row.rarity_label} className="rounded-xl border p-4"
                  style={{ background: '#0d0d0d', borderColor: cfg.border, borderLeftWidth: 3 }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span style={{ color: cfg.text, fontSize: 11 }}>{cfg.icon}</span>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.text }}>{row.rarity_label}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{Number(row.item_count).toLocaleString()}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#555' }}>{pct}% · avg score {row.avg_score}</div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Top rare items table */}
      {topRareItems.length > 0 && (
        <section>
          <SectionHeader right={`top ${topRareItems.length} · score ≥ 50`}>Top Rare Records in Catalog</SectionHeader>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#1e1e1e' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#111', borderBottom: '1px solid #1e1e1e' }}>
                  {['#', '', 'Artist / Album', 'Rarity', 'Have', 'Want', 'Listeners', 'Format', 'Sold'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#555', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topRareItems.map((row, i) => {
                  const cfg = RARITY_CFG[row.rarity_label] ?? RARITY_CFG['Common']
                  return (
                    <tr key={row.catalog_object_id} style={{ borderTop: '1px solid #1a1a1a', background: i % 2 === 0 ? 'transparent' : '#090909' }}>
                      <td className="px-3 py-2 text-xs font-bold tabular-nums" style={{ color: i < 3 ? '#f59e0b' : '#333' }}>{i + 1}</td>
                      <td className="px-2 py-2">
                        {row.thumbnail_url
                          ? <img src={row.thumbnail_url} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', border: '1px solid #222' }} />
                          : <div style={{ width: 32, height: 32, borderRadius: 4, background: '#1a1a1a', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🎵</div>
                        }
                      </td>
                      <td className="px-3 py-2" style={{ maxWidth: 240 }}>
                        {row.artist_name && (
                          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: '#ff6b35', fontSize: 10 }}>{row.artist_name}</div>
                        )}
                        <div className="text-xs font-medium" style={{ color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{row.item_name}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.text }}>
                          {cfg.icon} {row.rarity_score}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums" style={{ color: '#666' }}>
                        {row.discogs_have ? parseInt(row.discogs_have).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums font-semibold" style={{ color: row.discogs_want && parseInt(row.discogs_want) > 50 ? '#f59e0b' : '#666' }}>
                        {row.discogs_want ? parseInt(row.discogs_want).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums" style={{ color: row.lastfm_listeners > 0 ? '#d94343' : '#333' }}>
                        {row.lastfm_listeners > 0 ? fmtListeners(row.lastfm_listeners) : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs" style={{ color: '#666' }}>{row.format ?? '—'}</td>
                      <td className="px-3 py-2 text-xs font-semibold" style={{ color: row.times_sold > 0 ? '#ff6b35' : '#333' }}>{row.times_sold > 0 ? `${row.times_sold}×` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {scoredRows.length === 0 && topRareItems.length === 0 && (
        <div className="rounded-xl border flex items-center justify-center py-8" style={{ borderColor: '#1e1e1e', borderStyle: 'dashed' }}>
          <span className="text-xs" style={{ color: '#555' }}>Enrichment running — rarity data will appear as Discogs data fills in</span>
        </div>
      )}
    </div>
  )
}

type Tab = 'square' | 'inventory' | 'instagram' | 'facebook' | 'tiktok' | 'catalog' | 'database' | 'db-overview' | 'enrichment'

export default function DeadWaxClient({
  squareSummary, squareTopItems, recentPayments,
  instagramMedia, instagramAccount, instagramDemographics,
  facebookPosts, dbStats, columnProfiles, catalogOverview,
  enrichmentStats, enrichmentSample, discogsSample, lastfmSample,
  rarityDistribution, popularityLeaderboard, topRareItems,
  squareKpis, squareSalesByDate, squareSalesByFormat,
  squareSalesByCondition, squareCatalogByGenre, squareInventoryByYear,
  squareFlatFacts,
  inventoryKpis, inventoryGroupedFacts, inventoryGrowthByMonth, inventoryGenreBreakdown, inventoryItemsByYear,
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
            <TabButton active={activeTab === 'inventory'}   onClick={() => setActiveTab('inventory')}>📦 Inventory</TabButton>
            <TabButton active={activeTab === 'catalog'}     onClick={() => setActiveTab('catalog')}>📋 Catalog</TabButton>
            <TabButton active={activeTab === 'instagram'}   onClick={() => setActiveTab('instagram')}>📸 Instagram</TabButton>
            <TabButton active={activeTab === 'facebook'}    onClick={() => setActiveTab('facebook')}>👥 Facebook</TabButton>
            <TabButton active={activeTab === 'tiktok'}      onClick={() => setActiveTab('tiktok')}>🎵 TikTok</TabButton>
            <TabButton active={activeTab === 'database'}    onClick={() => setActiveTab('database')}>🗄️ Database</TabButton>
            <TabButton active={activeTab === 'db-overview'} onClick={() => setActiveTab('db-overview')}>🗺️ DB Overview</TabButton>
            <TabButton active={activeTab === 'enrichment'}  onClick={() => setActiveTab('enrichment')}>✨ Enrichment</TabButton>
            <div style={{ width: 1, background: '#333', alignSelf: 'stretch', margin: '2px 4px' }} />
            <TabButton active={false} onClick={() => router.push('/shop')}>🛍️ Shop</TabButton>
            <TabButton active={false} onClick={() => router.push('/chi/mgmt')}>📊 Mgmt Dashboard</TabButton>
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
          {activeTab === 'inventory' && (
            <InventoryPanel
              kpis={inventoryKpis}
              groupedFacts={inventoryGroupedFacts}
              growthByMonth={inventoryGrowthByMonth}
              genreBreakdown={inventoryGenreBreakdown}
              inventoryByYear={inventoryItemsByYear}
            />
          )}
          {activeTab === 'catalog' && (
            <div>
              {catalogOverview
                ? <CatalogOverview data={catalogOverview} />
                : <p className="text-sm text-text-muted">Catalog data unavailable.</p>}
              <RaritySection rarityDistribution={rarityDistribution} topRareItems={topRareItems} />
            </div>
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
            <EnrichmentPanel
              stats={enrichmentStats}
              sample={enrichmentSample}
              discogsSample={discogsSample}
              lastfmSample={lastfmSample}
              rarityDistribution={rarityDistribution}
              popularityLeaderboard={popularityLeaderboard}
            />
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
