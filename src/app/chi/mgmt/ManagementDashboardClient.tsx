'use client'

/**
 * Dead Wax Records — Strategy & Operations Dashboard (Client Component)
 * Johnny Outlaw, LLC — Designed in Rockwall, TX
 *
 * Role-based dashboard: Alan (Owner), Brad (Operations), Sam (Social)
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'alan' | 'brad' | 'sam'
type AlanTab = 'overview' | 'customers' | 'inventory-mix' | 'whats-working'
type BradTab  = 'inventory' | 'events' | 'alerts'
type SamTab   = 'post-tracker' | 'platforms'

interface SquareKpis {
  total_revenue: number; total_orders: number; avg_order: number
  top_format: string; top_genre: string
}
interface SalesByDate { sale_date: string; revenue_cents: number; order_count: number }
interface GenreRow    { genre: string; times_sold: number; revenue_cents: number }
interface InventoryKpis {
  total_items: number; total_value_cents: number; avg_price_cents: number
  formats: number; conditions: number
}
interface InventoryFact {
  label: string; val1: number; val2: number
  format?: string; condition?: string; genre?: string
}
interface Customer {
  customer_id: string; full_name: string; email_address: string
  creation_source: string; order_count: number; total_spend: number
}
interface CustomerStats {
  total_customers: number; customers_w_orders: number; total_orders: number
  avg_spend_per_customer: number; avg_orders_per_customer: number
}
interface IgSummary {
  username: string; followers: number; media_count: number; total_posts: number
  avg_likes: number; avg_comments: number; avg_saves: number; avg_shares: number
  avg_engagement: number; top_post_likes: number
}
interface IgPost {
  media_id: string; caption: string; media_type: string; posted_at: string
  likes: number; comments: number; saved: number; shares: number; total_eng: number
}
interface IgReach { day: string; reach: number }
interface FbSummary {
  page_name: string; followers: number; star_rating: number; total_posts: number
  avg_clicks: number; avg_reach: number; avg_video_views: number; top_post_clicks: number
}
interface FbPost {
  post_id: string; message: string; created_time: string
  clicks: number; impressions_uniq: number; video_views: number
  likes: number; comments: number; shares: number; total_eng: number
}

interface Props {
  userEmail: string
  squareKpis: SquareKpis | null
  squareSalesByDate: SalesByDate[]
  squareCatalogByGenre: GenreRow[]
  inventoryKpis: InventoryKpis | null
  inventoryFlatFacts: InventoryFact[]
  topCustomers: Customer[]
  customerStats: CustomerStats | null
  igSummary: IgSummary | null
  igPosts: IgPost[]
  igReachTrend: IgReach[]
  fbSummary: FbSummary | null
  fbPosts: FbPost[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const $$ = (n: number | null | undefined, dec = 0) =>
  n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })

const num = (n: number | null | undefined) =>
  n == null ? '—' : Number(n).toLocaleString('en-US')

function ago(iso: string) {
  const d = new Date(iso)
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return days + 'd ago'
  if (days < 30) return Math.floor(days / 7) + 'w ago'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG     = '#0f0f1a'
const CARD   = '#1a1a2a'
const CARD2  = '#16162a'
const BORDER = '#2d2d44'
const MUTED  = '#64748b'
const SUB    = '#94a3b8'
const TEXT   = '#e2e8f0'

const ACCENT: Record<Role, string> = { alan: '#f59e0b', brad: '#10b981', sam: '#a855f7' }

// ─── Shared UI ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div style={{ background: CARD, borderRadius: 12, padding: '16px 18px', borderLeft: '3px solid ' + accent }}>
      <div style={{ color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD, borderRadius: 12, padding: '18px 20px', marginBottom: 18 }}>
      <div style={{ color: SUB, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  )
}

function TabBtn({ active, onClick, accent, children }: { active: boolean; onClick: () => void; accent: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '9px 18px', border: 'none', cursor: 'pointer', background: 'transparent',
      fontSize: 13, fontWeight: active ? 700 : 400, color: active ? accent : MUTED,
      borderBottom: '2px solid ' + (active ? accent : 'transparent'), transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>{children}</button>
  )
}

function Tbl({ heads, children }: { heads: string[]; children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 8, background: CARD2 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {heads.map(h => (
              <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: CARD2, position: 'sticky', top: 0 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Tr({ cells, highlight }: { cells: React.ReactNode[]; highlight?: boolean }) {
  return (
    <tr style={{ borderTop: '1px solid ' + BORDER, background: highlight ? '#2a2a10' : 'transparent' }}>
      {cells.map((c, i) => <td key={i} style={{ padding: '9px 12px', color: TEXT, verticalAlign: 'middle' }}>{c}</td>)}
    </tr>
  )
}

function EngBadge({ val, color }: { val: number | null; color: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: color + '22', color }}>
      {val ?? 0}
    </span>
  )
}

// ─── SVG Sparkline ────────────────────────────────────────────────────────────

function Sparkline({ data, color, height = 52, width = 280 }: { data: number[]; color: string; height?: number; width?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height * 0.85 - height * 0.075
    return x + ',' + y
  }).join(' ')
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ rows, color }: { rows: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...rows.map(r => r.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {rows.map(r => (
        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 130, fontSize: 12, color: SUB, textAlign: 'right', flexShrink: 0, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</div>
          <div style={{ flex: 1, background: CARD2, borderRadius: 3, height: 14, position: 'relative', minWidth: 60 }}>
            <div style={{ width: (r.value / max * 100) + '%', height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ width: 64, fontSize: 12, color: TEXT, flexShrink: 0 }}>{num(Math.round(r.value))}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Revenue SVG Chart ────────────────────────────────────────────────────────

function RevenueChart({ data, color }: { data: SalesByDate[]; color: string }) {
  if (!data.length) return <div style={{ color: MUTED, fontSize: 13 }}>No revenue data yet</div>
  const W = 560; const H = 130; const PAD = 36
  const vals = data.map(d => d.revenue_cents / 100)
  const maxV = Math.max(...vals, 1)
  const x = (i: number) => PAD + (i / Math.max(vals.length - 1, 1)) * (W - PAD * 2)
  const y = (v: number) => PAD + (1 - v / maxV) * (H - PAD * 2)
  const linePts = vals.map((v, i) => x(i) + ',' + y(v)).join(' ')
  const areaD = 'M' + x(0) + ',' + y(vals[0]) + ' L' + vals.map((v, i) => x(i) + ',' + y(v)).join(' L') + ' L' + x(vals.length - 1) + ',' + (H - PAD) + ' L' + PAD + ',' + (H - PAD) + ' Z'
  const labels = [0, Math.floor(vals.length * 0.33), Math.floor(vals.length * 0.66), vals.length - 1].filter((v, i, a) => a.indexOf(v) === i && v < data.length)
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={'0 0 ' + W + ' ' + H} style={{ width: '100%', minWidth: 280, display: 'block' }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#revGrad)" />
        <polyline points={linePts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {[0, 0.5, 1].map(f => {
          const yy = PAD + (1 - f) * (H - PAD * 2); const v = f * maxV
          return <text key={f} x={PAD - 5} y={yy + 4} textAnchor="end" fontSize={9} fill={MUTED}>{v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + v.toFixed(0)}</text>
        })}
        {labels.map(i => (
          <text key={i} x={x(i)} y={H - 4} textAnchor="middle" fontSize={9} fill={MUTED}>
            {new Date(data[i].sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ─── ALAN Dashboard ───────────────────────────────────────────────────────────

function AlanOverview({ kpis, sales, accent }: { kpis: SquareKpis | null; sales: SalesByDate[]; accent: string }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KpiCard label="Total Revenue" value={$$(kpis ? kpis.total_revenue / 100 : null)} sub="All-time" accent={accent} />
        <KpiCard label="Total Orders"  value={num(kpis?.total_orders)} sub="All-time" accent={accent} />
        <KpiCard label="Avg Order Value" value={$$(kpis ? kpis.avg_order / 100 : null, 2)} accent={accent} />
        <KpiCard label="Top Format" value={kpis?.top_format ?? '—'} accent={accent} />
        <KpiCard label="Top Genre"  value={kpis?.top_genre  ?? '—'} accent={accent} />
      </div>
      <Section title="Daily Revenue — Last 60 Days">
        <RevenueChart data={sales} color={accent} />
      </Section>
    </div>
  )
}

function AlanCustomers({ customers, stats, accent }: { customers: Customer[]; stats: CustomerStats | null; accent: string }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KpiCard label="Total Customers"       value={num(stats?.total_customers)} accent={accent} />
        <KpiCard label="w/ Purchases"          value={num(stats?.customers_w_orders)} accent={accent} />
        <KpiCard label="Total Orders"          value={num(stats?.total_orders)} accent={accent} />
        <KpiCard label="Avg Spend / Customer"  value={$$(stats?.avg_spend_per_customer, 2)} accent={accent} />
        <KpiCard label="Avg Orders / Customer" value={stats?.avg_orders_per_customer?.toFixed(1) ?? '—'} accent={accent} />
      </div>
      <Section title="Top Customers — All-Time Spend">
        <Tbl heads={['#', 'Name', 'Email', 'Source', 'Orders', 'Total Spend']}>
          {customers.map((c, i) => (
            <Tr key={c.customer_id} highlight={i === 0} cells={[
              <span style={{ color: i < 3 ? accent : MUTED, fontWeight: 700 }}>{i + 1}</span>,
              <span style={{ fontWeight: 600 }}>{c.full_name || '(no name)'}</span>,
              <span style={{ color: MUTED, fontSize: 12 }}>{c.email_address || '—'}</span>,
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: accent + '22', color: accent }}>{c.creation_source || '—'}</span>,
              <span>{num(c.order_count)}</span>,
              <span style={{ fontWeight: 700, color: accent }}>{$$(c.total_spend, 2)}</span>,
            ]} />
          ))}
        </Tbl>
        <p style={{ color: MUTED, fontSize: 11, marginTop: 10 }}>
          * Loyalty tiers and social handles require Square Loyalty API integration (not yet synced)
        </p>
      </Section>
    </div>
  )
}

function AlanInventoryMix({ genres, accent }: { genres: GenreRow[]; accent: string }) {
  const top = genres.slice(0, 20)
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KpiCard label="Genres Tracked"  value={String(genres.length)} accent={accent} />
        <KpiCard label="Total Units Sold" value={num(genres.reduce((s, g) => s + g.times_sold, 0))} accent={accent} />
        <KpiCard label="Genre Revenue"    value={$$(genres.reduce((s, g) => s + g.revenue_cents, 0) / 100)} accent={accent} />
        <KpiCard label="Top Genre"        value={genres[0]?.genre ?? '—'} accent={accent} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <Section title="Units Sold by Genre (Top 20)">
          <BarChart rows={top.map(g => ({ label: g.genre, value: g.times_sold }))} color={accent} />
        </Section>
        <Section title="Revenue by Genre (Top 20)">
          <BarChart rows={top.map(g => ({ label: g.genre, value: Math.round(g.revenue_cents / 100) }))} color={accent} />
        </Section>
      </div>
      <div style={{ background: accent + '11', border: '1px solid ' + accent + '33', borderRadius: 10, padding: '12px 16px' }}>
        <strong style={{ color: accent, fontSize: 13 }}>💡 Genre Targets</strong>
        <p style={{ color: SUB, fontSize: 12, margin: '6px 0 0', lineHeight: 1.6 }}>
          The mock showed actual vs. target allocation. To enable that, define target % per genre — we store them in a <code style={{ background: CARD2, padding: '1px 5px', borderRadius: 4 }}>genre_targets</code> table and the over/under alerts build automatically.
        </p>
      </div>
    </div>
  )
}

function AlanWhatsWorking({ kpis, genres, igSummary, fbSummary, accent }: { kpis: SquareKpis | null; genres: GenreRow[]; igSummary: IgSummary | null; fbSummary: FbSummary | null; accent: string }) {
  const igEngRate = igSummary ? ((igSummary.avg_engagement / Math.max(igSummary.followers, 1)) * 100).toFixed(2) : null
  const wins = [
    kpis?.top_format && kpis.top_format + ' is your best-selling format',
    kpis?.top_genre  && kpis.top_genre + ' leads all genres in sales velocity',
    igSummary && 'Instagram averaging ' + Number(igSummary.avg_likes).toFixed(0) + ' likes/post — top post hit ' + num(igSummary.top_post_likes) + ' likes',
    fbSummary && 'Facebook page has ' + num(fbSummary.followers) + ' followers · ' + fbSummary.star_rating + '⭐ rating',
  ].filter(Boolean) as string[]
  const attention = [
    igEngRate && Number(igEngRate) < 3 && 'Instagram engagement rate is under 3% — try more interactive content (polls, giveaways)',
    fbSummary && fbSummary.avg_clicks < 30 && 'Facebook avg clicks/post is low — visual refresh or boosted posts may help',
    genres.length > 3 && 'Low-velocity genres worth promoting: ' + genres.slice(-4).map(g => g.genre).join(', '),
  ].filter(Boolean) as string[]
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
        <div>
          <div style={{ color: '#10b981', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>✅ What's Working</div>
          {wins.map((w, i) => <div key={i} style={{ background: CARD, borderLeft: '3px solid #10b981', borderRadius: 8, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: TEXT, lineHeight: 1.5 }}>{w}</div>)}
          {wins.length === 0 && <div style={{ color: MUTED, fontSize: 13 }}>No data available</div>}
        </div>
        <div>
          <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>⚠️ Needs Attention</div>
          {attention.map((a, i) => <div key={i} style={{ background: CARD, borderLeft: '3px solid #f59e0b', borderRadius: 8, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: TEXT, lineHeight: 1.5 }}>{a}</div>)}
          {attention.length === 0 && <div style={{ color: '#10b981', fontSize: 13 }}>All systems looking good 🎉</div>}
        </div>
      </div>
      <Section title="Platform Snapshot">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div style={{ fontWeight: 700, color: '#e1306c', marginBottom: 10, fontSize: 13 }}>📸 Instagram</div>
            <div style={{ fontSize: 13, color: TEXT, lineHeight: 2.2 }}>
              <div>Followers: <strong>{num(igSummary?.followers)}</strong></div>
              <div>Avg Likes/Post: <strong>{Number(igSummary?.avg_likes ?? 0).toFixed(0)}</strong></div>
              <div>Avg Comments: <strong>{Number(igSummary?.avg_comments ?? 0).toFixed(0)}</strong></div>
              <div>Eng Rate: <strong>{igEngRate ? igEngRate + '%' : '—'}</strong></div>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#1877f2', marginBottom: 10, fontSize: 13 }}>👥 Facebook</div>
            <div style={{ fontSize: 13, color: TEXT, lineHeight: 2.2 }}>
              <div>Followers: <strong>{num(fbSummary?.followers)}</strong></div>
              <div>Avg Clicks/Post: <strong>{Number(fbSummary?.avg_clicks ?? 0).toFixed(0)}</strong></div>
              <div>Avg Reach/Post: <strong>{Number(fbSummary?.avg_reach ?? 0).toFixed(0)}</strong></div>
              <div>Star Rating: <strong>{fbSummary?.star_rating ?? '—'} ⭐</strong></div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

// ─── BRAD Dashboard ───────────────────────────────────────────────────────────

function BradInventory({ invKpis, genres, accent }: { invKpis: InventoryKpis | null; genres: GenreRow[]; accent: string }) {
  const top12 = genres.slice(0, 12)
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KpiCard label="Total Items"    value={num(invKpis?.total_items)} accent={accent} />
        <KpiCard label="Catalog Value"  value={$$(((invKpis?.total_value_cents) ?? 0) / 100)} accent={accent} />
        <KpiCard label="Avg Item Price" value={$$(((invKpis?.avg_price_cents) ?? 0) / 100, 2)} accent={accent} />
        <KpiCard label="Formats"        value={num(invKpis?.formats)} accent={accent} />
        <KpiCard label="Conditions"     value={num(invKpis?.conditions)} accent={accent} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Section title="Units Sold by Genre">
          <BarChart rows={top12.map(g => ({ label: g.genre, value: g.times_sold }))} color={accent} />
        </Section>
        <Section title="Revenue by Genre">
          <BarChart rows={top12.map(g => ({ label: g.genre, value: Math.round(g.revenue_cents / 100) }))} color={accent} />
        </Section>
      </div>
    </div>
  )
}

function BradAlerts({ genres, accent }: { genres: GenreRow[]; accent: string }) {
  const sorted = [...genres].sort((a, b) => b.times_sold - a.times_sold)
  const hot  = sorted.slice(0, 5)
  const slow = sorted.filter(g => g.times_sold <= 2).slice(0, 6)
  return (
    <div>
      <Section title="🔥 High Velocity — Consider Restocking">
        {hot.map(g => (
          <div key={g.genre} style={{ background: CARD2, borderLeft: '3px solid ' + accent, borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: 13 }}>{g.genre}</span>
            <span style={{ color: accent, fontWeight: 700 }}>{num(g.times_sold)} sold · {$$(g.revenue_cents / 100)}</span>
          </div>
        ))}
      </Section>
      <Section title="🐢 Low Velocity — Promotion Candidates">
        {slow.length === 0
          ? <div style={{ color: MUTED, fontSize: 13 }}>No low-velocity genres detected</div>
          : slow.map(g => (
            <div key={g.genre} style={{ background: CARD2, borderLeft: '3px solid #f59e0b', borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: 13 }}>{g.genre}</span>
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>{num(g.times_sold)} sold</span>
            </div>
          ))
        }
      </Section>
      <div style={{ color: MUTED, fontSize: 12, padding: '0 4px' }}>
        * Deficit alerts vs. target unlock once genre targets are defined.
      </div>
    </div>
  )
}

function BradEvents() {
  return (
    <div style={{ background: CARD, borderRadius: 12, padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: TEXT, marginBottom: 8 }}>Events Tracker — Coming Soon</div>
      <p style={{ color: MUTED, fontSize: 13, maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.6 }}>
        The mock showed events (Heavy Metal Night, Jazz Night, etc.) with RSVP counts and attendance estimators. We need a data source first.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { l: 'Option A', d: 'Manual entry form → Supabase events table', c: '#10b981' },
          { l: 'Option B', d: 'Square Events API (if Dead Wax uses it)', c: '#f59e0b' },
          { l: 'Option C', d: 'Facebook Events RSVPs via API', c: '#3b82f6' },
        ].map(o => (
          <div key={o.l} style={{ background: CARD2, border: '1px solid ' + o.c + '44', borderRadius: 10, padding: '12px 16px', minWidth: 180, maxWidth: 220, textAlign: 'left' }}>
            <div style={{ color: o.c, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{o.l}</div>
            <div style={{ color: MUTED, fontSize: 12, lineHeight: 1.5 }}>{o.d}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SAM Dashboard ────────────────────────────────────────────────────────────

function SamPlatforms({ igSummary, igPosts, igReach, fbSummary, fbPosts, accent }: { igSummary: IgSummary | null; igPosts: IgPost[]; igReach: IgReach[]; fbSummary: FbSummary | null; fbPosts: FbPost[]; accent: string }) {
  const igEngRate = igSummary ? ((igSummary.avg_engagement / Math.max(igSummary.followers, 1)) * 100).toFixed(2) : '—'
  const igLikes = [...igPosts].sort((a, b) => new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime()).map(p => p.likes || 0)
  const fbClicks = [...fbPosts].sort((a, b) => new Date(a.created_time).getTime() - new Date(b.created_time).getTime()).map(p => p.clicks || 0)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div style={{ background: CARD, borderRadius: 12, padding: '20px', borderTop: '3px solid #e1306c' }}>
          <div style={{ fontWeight: 700, color: '#e1306c', fontSize: 14, marginBottom: 14 }}>📸 Instagram @{igSummary?.username ?? 'deadwaxrecords'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <KpiCard label="Followers"      value={num(igSummary?.followers)} accent="#e1306c" />
            <KpiCard label="Avg Likes/Post" value={Number(igSummary?.avg_likes ?? 0).toFixed(0)} accent="#e1306c" />
            <KpiCard label="Avg Comments"   value={Number(igSummary?.avg_comments ?? 0).toFixed(0)} accent="#e1306c" />
            <KpiCard label="Avg Saves"      value={Number(igSummary?.avg_saves ?? 0).toFixed(0)} accent="#e1306c" />
            <KpiCard label="Eng Rate"       value={igEngRate + '%'} accent="#e1306c" />
            <KpiCard label="Top Post Likes" value={num(igSummary?.top_post_likes)} accent="#e1306c" />
          </div>
          <div style={{ color: MUTED, fontSize: 11, marginBottom: 6 }}>LIKES TREND</div>
          <Sparkline data={igLikes} color="#e1306c" width={280} height={52} />
        </div>

        <div style={{ background: CARD, borderRadius: 12, padding: '20px', borderTop: '3px solid #1877f2' }}>
          <div style={{ fontWeight: 700, color: '#1877f2', fontSize: 14, marginBottom: 14 }}>👥 Facebook — {fbSummary?.page_name ?? 'Dead Wax Records'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <KpiCard label="Page Followers"   value={num(fbSummary?.followers)} accent="#1877f2" />
            <KpiCard label="Avg Clicks/Post"  value={Number(fbSummary?.avg_clicks ?? 0).toFixed(0)} accent="#1877f2" />
            <KpiCard label="Avg Reach/Post"   value={Number(fbSummary?.avg_reach ?? 0).toFixed(0)} accent="#1877f2" />
            <KpiCard label="Avg Video Views"  value={Number(fbSummary?.avg_video_views ?? 0).toFixed(0)} accent="#1877f2" />
            <KpiCard label="Star Rating"      value={(fbSummary?.star_rating ?? '—') + ' ⭐'} accent="#1877f2" />
            <KpiCard label="Posts Tracked"    value={num(fbSummary?.total_posts)} accent="#1877f2" />
          </div>
          <div style={{ color: MUTED, fontSize: 11, marginBottom: 6 }}>CLICKS TREND</div>
          <Sparkline data={fbClicks} color="#1877f2" width={280} height={52} />
        </div>
      </div>

      {igReach.length > 0 && (
        <Section title={'Instagram Daily Reach (' + igReach.length + ' days)'}>
          <BarChart rows={igReach.map(r => ({ label: new Date(r.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: Number(r.reach) }))} color="#e1306c" />
        </Section>
      )}

      <Section title="Top Instagram Posts — by Engagement">
        <Tbl heads={['Posted', 'Caption', '❤️ Likes', '💬', '🔖', '↗️', 'Total']}>
          {[...igPosts].sort((a, b) => b.total_eng - a.total_eng).slice(0, 10).map(p => (
            <Tr key={p.media_id} cells={[
              <span style={{ color: MUTED, fontSize: 11 }}>{ago(p.posted_at)}</span>,
              <span style={{ fontSize: 12, color: SUB, maxWidth: 220, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption || '(no caption)'}</span>,
              <EngBadge val={p.likes} color="#e1306c" />,
              <EngBadge val={p.comments} color="#f59e0b" />,
              <EngBadge val={p.saved} color="#3b82f6" />,
              <EngBadge val={p.shares} color="#10b981" />,
              <span style={{ fontWeight: 700, color: accent }}>{num(p.total_eng)}</span>,
            ]} />
          ))}
        </Tbl>
      </Section>
    </div>
  )
}

function SamPostTracker({ igPosts, fbPosts, accent }: { igPosts: IgPost[]; fbPosts: FbPost[]; accent: string }) {
  const [view, setView] = useState<'ig' | 'fb'>('ig')
  const [sort, setSort] = useState<'date' | 'eng'>('date')

  const sortedIg = useMemo(() => {
    const c = [...igPosts]
    return sort === 'eng' ? c.sort((a, b) => b.total_eng - a.total_eng) : c.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())
  }, [igPosts, sort])

  const sortedFb = useMemo(() => {
    const c = [...fbPosts]
    return sort === 'eng' ? c.sort((a, b) => b.total_eng - a.total_eng) : c.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime())
  }, [fbPosts, sort])

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: CARD, borderRadius: 8, overflow: 'hidden' }}>
          {(['ig', 'fb'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: view === v ? accent : 'transparent', color: view === v ? '#0f0f1a' : MUTED, transition: 'all 0.15s' }}>
              {v === 'ig' ? '📸 Instagram' : '👥 Facebook'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', background: CARD, borderRadius: 8, overflow: 'hidden' }}>
          {(['date', 'eng'] as const).map(v => (
            <button key={v} onClick={() => setSort(v)} style={{ padding: '7px 14px', border: 'none', cursor: 'pointer', fontSize: 12, background: sort === v ? BORDER : 'transparent', color: sort === v ? TEXT : MUTED, transition: 'all 0.15s' }}>
              {v === 'date' ? '🕐 Recent' : '🔥 Top Eng'}
            </button>
          ))}
        </div>
      </div>

      {view === 'ig' && (
        <Tbl heads={['Posted', 'Type', 'Caption', '❤️ Likes', '💬', '🔖 Saved', '↗️', 'Total Eng']}>
          {sortedIg.map(p => (
            <Tr key={p.media_id} cells={[
              <span style={{ color: MUTED, fontSize: 11 }}>{ago(p.posted_at)}</span>,
              <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 8, background: accent + '22', color: accent }}>{p.media_type?.replace('_', ' ') ?? '—'}</span>,
              <span style={{ fontSize: 12, color: SUB, maxWidth: 240, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption || '(no caption)'}</span>,
              <EngBadge val={p.likes} color="#e1306c" />,
              <EngBadge val={p.comments} color="#f59e0b" />,
              <EngBadge val={p.saved} color="#3b82f6" />,
              <EngBadge val={p.shares} color="#10b981" />,
              <span style={{ fontWeight: 700, color: accent }}>{num(p.total_eng)}</span>,
            ]} />
          ))}
        </Tbl>
      )}

      {view === 'fb' && (
        <Tbl heads={['Posted', 'Message', '🖱️ Clicks', '👁️ Reach', '🎬 Views', '❤️', '↗️', 'Total Eng']}>
          {sortedFb.map(p => (
            <Tr key={p.post_id} cells={[
              <span style={{ color: MUTED, fontSize: 11 }}>{ago(p.created_time)}</span>,
              <span style={{ fontSize: 12, color: SUB, maxWidth: 240, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.message || '(no text)'}</span>,
              <EngBadge val={p.clicks} color="#1877f2" />,
              <EngBadge val={p.impressions_uniq} color={accent} />,
              <EngBadge val={p.video_views} color="#10b981" />,
              <EngBadge val={p.likes} color="#e1306c" />,
              <EngBadge val={p.shares} color="#f59e0b" />,
              <span style={{ fontWeight: 700, color: accent }}>{num(p.total_eng)}</span>,
            ]} />
          ))}
        </Tbl>
      )}
    </div>
  )
}

// ─── Role Card ────────────────────────────────────────────────────────────────

function RoleCard({ name, role, description, accentColor, onSelect }: { name: string; role: string; description: string; accentColor: string; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onClick={onSelect} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ background: CARD, border: '1px solid ' + (hovered ? accentColor : BORDER), borderRadius: 16, padding: '28px 24px', width: 240, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease', transform: hovered ? 'translateY(-4px)' : 'translateY(0)', boxShadow: hovered ? '0 8px 32px ' + accentColor + '22' : 'none', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accentColor }} />
      <div style={{ fontSize: 42, marginBottom: 12 }}>{name === 'Alan' ? '👔' : name === 'Brad' ? '📦' : '📱'}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: accentColor, marginBottom: 4 }}>{name}</div>
      <div style={{ color: SUB, fontSize: 12, marginBottom: 12 }}>{role}</div>
      <div style={{ color: MUTED, fontSize: 12, lineHeight: 1.5, marginBottom: 20 }}>{description}</div>
      <button style={{ width: '100%', padding: '9px 0', border: 'none', borderRadius: 8, background: accentColor, color: '#0f0f1a', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Open My Dashboard</button>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ManagementDashboardClient({
  squareKpis, squareSalesByDate, squareCatalogByGenre,
  inventoryKpis, inventoryFlatFacts, topCustomers, customerStats,
  igSummary, igPosts, igReachTrend, fbSummary, fbPosts,
}: Props) {
  const [role, setRole] = useState<Role | null>(null)
  const [alanTab, setAlanTab] = useState<AlanTab>('overview')
  const [bradTab, setBradTab]  = useState<BradTab>('inventory')
  const [samTab, setSamTab]    = useState<SamTab>('platforms')
  const router = useRouter()
  const accent = role ? ACCENT[role] : '#f59e0b'

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14 }}>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', background: CARD, borderBottom: '1px solid ' + BORDER, position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => role ? setRole(null) : router.push('/chi')} style={{ background: 'transparent', border: '1px solid ' + BORDER, color: MUTED, padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
          ← {role ? 'Switch Role' : 'Back to CHI'}
        </button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Dead Wax Records</span>
        {role && (
          <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: accent + '22', color: accent }}>
            {role === 'alan' ? '👔 Alan — Owner' : role === 'brad' ? '📦 Brad — Operations' : '📱 Sam — Social Media'}
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: MUTED, fontSize: 11 }}>Strategy & Operations · Outlaw Apps</span>
      </header>

      <main style={{ padding: '0 24px 48px' }}>

        {/* Role Selector */}
        {!role && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', padding: '40px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '0.04em', color: '#f59e0b', marginBottom: 8 }}>DEAD WAX RECORDS</div>
              <div style={{ color: MUTED, fontSize: 13 }}>Strategy &amp; Operations Dashboard · Powered by Outlaw Apps</div>
            </div>
            <div style={{ color: SUB, marginBottom: 28, fontSize: 14 }}>Who are you? Select your dashboard.</div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 860 }}>
              <RoleCard name="Alan" role="Owner & Founder" description="Revenue, top customers, inventory strategy, and performance signals." accentColor="#f59e0b" onSelect={() => setRole('alan')} />
              <RoleCard name="Brad" role="Operations & Inventory" description="Inventory health, genre velocity, alerts, events tracker." accentColor="#10b981" onSelect={() => setRole('brad')} />
              <RoleCard name="Sam" role="Social Media Manager" description="Post tracker, platform analytics, and engagement trends." accentColor="#a855f7" onSelect={() => setRole('sam')} />
            </div>
            <div style={{ marginTop: 48, color: BORDER, fontSize: 11 }}>Dead Wax Records · Dallas, TX · Lakewood &amp; Deep Ellum · Outlaw Apps v1</div>
          </div>
        )}

        {/* Alan */}
        {role === 'alan' && (
          <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: accent, margin: 0 }}>Alan's Dashboard</h2>
              <p style={{ color: MUTED, fontSize: 12, margin: '4px 0 0' }}>Owner &amp; Founder · Revenue, customers, inventory, and performance</p>
            </div>
            <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid ' + BORDER, marginBottom: 28, overflowX: 'auto' }}>
              <TabBtn active={alanTab === 'overview'}      onClick={() => setAlanTab('overview')}      accent={accent}>📊 Overview</TabBtn>
              <TabBtn active={alanTab === 'customers'}     onClick={() => setAlanTab('customers')}     accent={accent}>👤 Customers</TabBtn>
              <TabBtn active={alanTab === 'inventory-mix'} onClick={() => setAlanTab('inventory-mix')} accent={accent}>📦 Inventory Mix</TabBtn>
              <TabBtn active={alanTab === 'whats-working'} onClick={() => setAlanTab('whats-working')} accent={accent}>✅ What's Working</TabBtn>
            </div>
            {alanTab === 'overview'      && <AlanOverview kpis={squareKpis} sales={squareSalesByDate} accent={accent} />}
            {alanTab === 'customers'     && <AlanCustomers customers={topCustomers} stats={customerStats} accent={accent} />}
            {alanTab === 'inventory-mix' && <AlanInventoryMix genres={squareCatalogByGenre} accent={accent} />}
            {alanTab === 'whats-working' && <AlanWhatsWorking kpis={squareKpis} genres={squareCatalogByGenre} igSummary={igSummary} fbSummary={fbSummary} accent={accent} />}
          </div>
        )}

        {/* Brad */}
        {role === 'brad' && (
          <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: accent, margin: 0 }}>Brad's Dashboard</h2>
              <p style={{ color: MUTED, fontSize: 12, margin: '4px 0 0' }}>Operations &amp; Inventory · Catalog health, alerts, events</p>
            </div>
            <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid ' + BORDER, marginBottom: 28, overflowX: 'auto' }}>
              <TabBtn active={bradTab === 'inventory'} onClick={() => setBradTab('inventory')} accent={accent}>📦 Inventory</TabBtn>
              <TabBtn active={bradTab === 'alerts'}    onClick={() => setBradTab('alerts')}    accent={accent}>🚨 Alerts</TabBtn>
              <TabBtn active={bradTab === 'events'}    onClick={() => setBradTab('events')}    accent={accent}>📅 Events</TabBtn>
            </div>
            {bradTab === 'inventory' && <BradInventory invKpis={inventoryKpis} genres={squareCatalogByGenre} accent={accent} />}
            {bradTab === 'alerts'    && <BradAlerts genres={squareCatalogByGenre} accent={accent} />}
            {bradTab === 'events'    && <BradEvents />}
          </div>
        )}

        {/* Sam */}
        {role === 'sam' && (
          <div style={{ maxWidth: 1200, margin: '0 auto', paddingTop: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: accent, margin: 0 }}>Sam's Dashboard</h2>
              <p style={{ color: MUTED, fontSize: 12, margin: '4px 0 0' }}>Social Media Manager · Post tracker and platform analytics</p>
            </div>
            <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid ' + BORDER, marginBottom: 28, overflowX: 'auto' }}>
              <TabBtn active={samTab === 'platforms'}    onClick={() => setSamTab('platforms')}    accent={accent}>📡 Platforms</TabBtn>
              <TabBtn active={samTab === 'post-tracker'} onClick={() => setSamTab('post-tracker')} accent={accent}>📝 Post Tracker</TabBtn>
            </div>
            {samTab === 'platforms'    && <SamPlatforms igSummary={igSummary} igPosts={igPosts} igReach={igReachTrend} fbSummary={fbSummary} fbPosts={fbPosts} accent={accent} />}
            {samTab === 'post-tracker' && <SamPostTracker igPosts={igPosts} fbPosts={fbPosts} accent={accent} />}
          </div>
        )}

      </main>
    </div>
  )
}
