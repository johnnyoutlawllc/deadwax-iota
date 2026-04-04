'use client'

/**
 * Dead Wax Records — Strategy & Operations Dashboard (Client Component)
 * Johnny Outlaw, LLC — Designed in Rockwall, TX
 *
 * Role-based dashboard: Alan (Owner), Brad (Operations), Sam (Social)
 */

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role    = 'alan' | 'brad' | 'sam'
type AlanTab = 'overview' | 'customers' | 'inventory-mix' | 'whats-working'
type BradTab = 'inventory' | 'events' | 'alerts'
type SamTab  = 'post-tracker' | 'platforms'

interface SquareKpis {
  total_sales_cents: number
  customer_count: number
  unique_items_sold: number
}
interface SalesByDate {
  sale_date: string
  order_count: number
  total_money_cents: number
  unique_customers: number
}
interface SalesByDow {
  dow: number
  day_name: string
  total_orders: number
  total_revenue_cents: number
  avg_revenue_cents: number
}
interface GenreRow    { genre: string; times_sold: number; revenue_cents: number }
interface InventoryKpis {
  total_items: number; total_value_cents: number; avg_price_cents: number
  formats: number; conditions: number
}
interface InventoryFact { label: string; val1: number; val2: number }
interface Customer {
  customer_id: string; full_name: string; email_address: string | null
  creation_source: string | null; order_count: number; total_spend: number
}
interface CustomerStats {
  total_customers: number; customers_w_orders: number; total_orders: number
  avg_spend_per_customer: number; avg_orders_per_customer: number
}
interface CustomerOrderItem {
  customer_id: string
  order_id: string
  order_date: string
  order_total_cents: number
  item_name: string
  variation_name: string
  quantity: number
  item_price_cents: number
  cover_url: string
  artist_name: string
  album_title: string
}
interface InventoryItem {
  catalog_object_id: string
  name: string
  format: string | null
  condition: string | null
  times_sold: number
  revenue_cents: number
  avg_price_cents: number
  cover_url: string
  artist_name: string
  album_title: string
  genres: string
  total_count: number
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
  salesByDow: SalesByDow[]
  customerOrderHistory: CustomerOrderItem[]
  inventoryItems: InventoryItem[]
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

function fbPostUrl(postId: string): string {
  const parts = postId.split('_')
  if (parts.length === 2) {
    return 'https://www.facebook.com/permalink.php?story_fbid=' + parts[1] + '&id=' + parts[0]
  }
  return 'https://www.facebook.com'
}

const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon-Sun display order

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG     = '#0f0f1a'
const CARD   = '#1a1a2a'
const CARD2  = '#16162a'
const CARD3  = '#121222'
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

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: CARD, borderRadius: 12, padding: '18px 20px', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ color: SUB, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{title}</div>
        {action}
      </div>
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

function EngBadge({ val, color }: { val: number | null; color: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: color + '22', color }}>
      {val ?? 0}
    </span>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: color + '22', color, marginRight: 4 }}>
      {label}
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

// ─── Clickable Bar Chart ──────────────────────────────────────────────────────

function BarChart({
  rows, color, onClickRow, selectedLabel,
}: {
  rows: { label: string; value: number }[]
  color: string
  onClickRow?: (label: string) => void
  selectedLabel?: string | null
}) {
  const max = Math.max(...rows.map(r => r.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {rows.map(r => {
        const isSelected = selectedLabel === r.label
        return (
          <div
            key={r.label}
            onClick={() => onClickRow?.(r.label)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: onClickRow ? 'pointer' : 'default', opacity: selectedLabel && !isSelected ? 0.45 : 1, transition: 'opacity 0.2s' }}
          >
            <div style={{ width: 130, fontSize: 12, color: isSelected ? color : SUB, fontWeight: isSelected ? 700 : 400, textAlign: 'right', flexShrink: 0, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</div>
            <div style={{ flex: 1, background: CARD2, borderRadius: 3, height: 14, position: 'relative', minWidth: 60 }}>
              <div style={{ width: (r.value / max * 100) + '%', height: '100%', background: isSelected ? color : color + 'aa', borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ width: 64, fontSize: 12, color: isSelected ? color : TEXT, fontWeight: isSelected ? 700 : 400, flexShrink: 0 }}>{num(Math.round(r.value))}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Revenue SVG Chart ────────────────────────────────────────────────────────

function RevenueChart({ data, color }: { data: SalesByDate[]; color: string }) {
  if (!data.length) return <div style={{ color: MUTED, fontSize: 13 }}>No revenue data yet</div>
  const W = 560; const H = 130; const PAD = 36
  const vals = data.map(d => d.total_money_cents / 100)
  const maxV = Math.max(...vals, 1)
  const xf = (i: number) => PAD + (i / Math.max(vals.length - 1, 1)) * (W - PAD * 2)
  const yf = (v: number) => PAD + (1 - v / maxV) * (H - PAD * 2)
  const linePts = vals.map((v, i) => xf(i) + ',' + yf(v)).join(' ')
  const areaD = 'M' + xf(0) + ',' + yf(vals[0]) + ' L' + vals.map((v, i) => xf(i) + ',' + yf(v)).join(' L') + ' L' + xf(vals.length - 1) + ',' + (H - PAD) + ' L' + PAD + ',' + (H - PAD) + ' Z'
  const labelIdxs = [0, Math.floor(vals.length * 0.33), Math.floor(vals.length * 0.66), vals.length - 1].filter((v, i, a) => a.indexOf(v) === i && v < data.length)
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
        {labelIdxs.map(i => (
          <text key={i} x={xf(i)} y={H - 4} textAnchor="middle" fontSize={9} fill={MUTED}>
            {new Date(data[i].sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ─── Unique Customers Chart ───────────────────────────────────────────────────

function UniqueCustomersChart({ data, color }: { data: SalesByDate[]; color: string }) {
  if (!data.length) return null
  const W = 560; const H = 90; const PAD = 32
  const vals = data.map(d => d.unique_customers ?? 0)
  const maxV = Math.max(...vals, 1)
  const xf = (i: number) => PAD + (i / Math.max(vals.length - 1, 1)) * (W - PAD * 2)
  const yf = (v: number) => PAD + (1 - v / maxV) * (H - PAD * 2)
  const linePts = vals.map((v, i) => xf(i) + ',' + yf(v)).join(' ')
  const areaD = 'M' + xf(0) + ',' + yf(vals[0]) + ' L' + vals.map((v, i) => xf(i) + ',' + yf(v)).join(' L') +
    ' L' + xf(vals.length - 1) + ',' + (H - PAD) + ' L' + PAD + ',' + (H - PAD) + ' Z'
  const labelIdxs = [0, Math.floor(vals.length * 0.5), vals.length - 1].filter((v, i, a) => a.indexOf(v) === i && v < data.length)
  return (
    <svg viewBox={'0 0 ' + W + ' ' + H} style={{ width: '100%', minWidth: 280, display: 'block' }}>
      <defs>
        <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#custGrad)" />
      <polyline points={linePts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {[0, maxV].map((v, fi) => {
        const yy = fi === 0 ? H - PAD : PAD
        return <text key={fi} x={PAD - 5} y={yy + 4} textAnchor="end" fontSize={8} fill={MUTED}>{v}</text>
      })}
      {labelIdxs.map(i => (
        <text key={i} x={xf(i)} y={H - 2} textAnchor="middle" fontSize={8} fill={MUTED}>
          {new Date(data[i].sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </text>
      ))}
    </svg>
  )
}

// ─── DOW Chart ────────────────────────────────────────────────────────────────

function DowChart({ data, color }: { data: SalesByDow[]; color: string }) {
  if (!data.length) return <div style={{ color: MUTED, fontSize: 13 }}>No data</div>

  const ordered = DOW_ORDER.map(d => data.find(r => r.dow === d)).filter(Boolean) as SalesByDow[]
  const maxRev = Math.max(...ordered.map(r => r.total_revenue_cents / 100), 1)
  const maxAvg = Math.max(...ordered.map(r => r.avg_revenue_cents / 100), 1)
  const barW = 56
  const W = ordered.length * (barW + 12) + 20
  const H = 120
  const PAD = 28

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      {/* Total Revenue by DOW */}
      <div>
        <div style={{ color: MUTED, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Total Revenue</div>
        <div style={{ overflowX: 'auto' }}>
          <svg viewBox={'0 0 ' + W + ' ' + H} style={{ width: '100%', minWidth: 300, display: 'block' }}>
            {ordered.map((r, i) => {
              const v = r.total_revenue_cents / 100
              const barH = Math.max(4, (v / maxRev) * (H - PAD - 20))
              const x = i * (barW + 12) + 10
              const y = H - PAD - barH
              return (
                <g key={r.dow}>
                  <rect x={x} y={y} width={barW} height={barH} fill={color + 'cc'} rx={3} />
                  <text x={x + barW / 2} y={H - PAD + 12} textAnchor="middle" fontSize={9} fill={SUB}>{r.day_name.slice(0, 3)}</text>
                  <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={8} fill={color}>
                    {v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + v.toFixed(0)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
      {/* Avg Order Value by DOW */}
      <div>
        <div style={{ color: MUTED, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Avg Order Value</div>
        <div style={{ overflowX: 'auto' }}>
          <svg viewBox={'0 0 ' + W + ' ' + H} style={{ width: '100%', minWidth: 300, display: 'block' }}>
            {ordered.map((r, i) => {
              const v = r.avg_revenue_cents / 100
              const barH = Math.max(4, (v / maxAvg) * (H - PAD - 20))
              const x = i * (barW + 12) + 10
              const y = H - PAD - barH
              return (
                <g key={r.dow}>
                  <rect x={x} y={y} width={barW} height={barH} fill={color + '88'} rx={3} />
                  <text x={x + barW / 2} y={H - PAD + 12} textAnchor="middle" fontSize={9} fill={SUB}>{r.day_name.slice(0, 3)}</text>
                  <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={8} fill={color}>
                    {v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + v.toFixed(0)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─── Expandable Post Row ──────────────────────────────────────────────────────

function IgPostRow({ p, accent }: { p: IgPost; accent: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <tr onClick={() => setOpen(o => !o)} style={{ borderTop: '1px solid ' + BORDER, cursor: 'pointer', background: open ? CARD + '88' : 'transparent' }}>
        <td style={{ padding: '9px 12px', color: MUTED, fontSize: 11 }}>{ago(p.posted_at)}</td>
        <td style={{ padding: '9px 12px' }}><span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 8, background: accent + '22', color: accent }}>{p.media_type?.replace('_', ' ') ?? '—'}</span></td>
        <td style={{ padding: '9px 12px', maxWidth: 240 }}><span style={{ fontSize: 12, color: SUB, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption || '(no caption)'}</span></td>
        <td style={{ padding: '9px 12px' }}><EngBadge val={p.likes}    color="#e1306c" /></td>
        <td style={{ padding: '9px 12px' }}><EngBadge val={p.comments} color="#f59e0b" /></td>
        <td style={{ padding: '9px 12px' }}><EngBadge val={p.saved}    color="#3b82f6" /></td>
        <td style={{ padding: '9px 12px' }}><EngBadge val={p.shares}   color="#10b981" /></td>
        <td style={{ padding: '9px 12px', fontWeight: 700, color: accent }}>{num(p.total_eng)}</td>
        <td style={{ padding: '9px 12px', color: MUTED, fontSize: 11 }}>{open ? '▲' : '▼'}</td>
      </tr>
      {open && (
        <tr style={{ background: CARD2 }}>
          <td colSpan={9} style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 10 }}>{p.caption || '(no caption)'}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: MUTED }}>{new Date(p.posted_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <a href="https://www.instagram.com/deadwaxrecords/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#e1306c22', color: '#e1306c', textDecoration: 'none', fontWeight: 600 }} onClick={e => e.stopPropagation()}>
                📸 View @deadwaxrecords
              </a>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function FbPostRow({ p, accent }: { p: FbPost; accent: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <tr onClick={() => setOpen(o => !o)} style={{ borderTop: '1px solid ' + BORDER, cursor: 'pointer', background: open ? CARD + '88' : 'transparent' }}>
        <td style={{ padding: '9px 12px', color: MUTED, fontSize: 11 }}>{ago(p.created_time)}</td>
        <td style={{ padding: '9px 12px', maxWidth: 240 }}><span style={{ fontSize: 12, color: SUB, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.message || '(no text)'}</span></td>
        <td style={{ padding: '9px 12px' }}><EngBadge val={p.clicks}           color="#1877f2" /></td>
        <td style={{ padding: '9px 12px' }}><EngBadge val={p.impressions_uniq} color={accent} /></td>
        <td style={{ padding: '9px 12px' }}><EngBadge val={p.video_views}      color="#10b981" /></td>
        <td style={{ padding: '9px 12px' }}><EngBadge val={p.likes}            color="#e1306c" /></td>
        <td style={{ padding: '9px 12px' }}><EngBadge val={p.shares}           color="#f59e0b" /></td>
        <td style={{ padding: '9px 12px', fontWeight: 700, color: accent }}>{num(p.total_eng)}</td>
        <td style={{ padding: '9px 12px', color: MUTED, fontSize: 11 }}>{open ? '▲' : '▼'}</td>
      </tr>
      {open && (
        <tr style={{ background: CARD2 }}>
          <td colSpan={9} style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 10 }}>{p.message || '(no text)'}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: MUTED }}>{new Date(p.created_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <a href={fbPostUrl(p.post_id)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#1877f222', color: '#1877f2', textDecoration: 'none', fontWeight: 600 }} onClick={e => e.stopPropagation()}>
                👥 View on Facebook ↗
              </a>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Customer Expandable Row ──────────────────────────────────────────────────

function CustomerRow({ c, rank, accent, orders }: { c: Customer; rank: number; accent: string; orders: CustomerOrderItem[] }) {
  const [open, setOpen] = useState(false)

  // Group orders by order_id
  const grouped = useMemo(() => {
    const map = new Map<string, CustomerOrderItem[]>()
    orders.forEach(o => {
      if (!map.has(o.order_id)) map.set(o.order_id, [])
      map.get(o.order_id)!.push(o)
    })
    return Array.from(map.entries()).sort((a, b) =>
      new Date(b[1][0].order_date).getTime() - new Date(a[1][0].order_date).getTime()
    )
  }, [orders])

  return (
    <>
      <tr
        onClick={() => setOpen(o => !o)}
        style={{ borderTop: '1px solid ' + BORDER, cursor: 'pointer', background: open ? accent + '08' : 'transparent', transition: 'background 0.15s' }}
      >
        <td style={{ padding: '12px 14px', color: rank < 3 ? accent : MUTED, fontWeight: 700, fontSize: 15 }}>
          {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}
        </td>
        <td style={{ padding: '12px 14px' }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.full_name}</div>
          <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginTop: 2 }}>{c.customer_id.slice(0, 24)}…</div>
        </td>
        <td style={{ padding: '12px 14px', color: SUB, fontSize: 13 }}>{num(c.order_count)}</td>
        <td style={{ padding: '12px 14px', fontWeight: 700, color: accent, fontSize: 14 }}>{$$(c.total_spend, 2)}</td>
        <td style={{ padding: '12px 14px', color: MUTED, fontSize: 12 }}>
          {orders.length > 0
            ? <span style={{ fontSize: 11, padding: '2px 8px', background: accent + '20', color: accent, borderRadius: 20, fontWeight: 600 }}>
                {grouped.length} order{grouped.length !== 1 ? 's' : ''}
              </span>
            : <span style={{ fontSize: 11, color: MUTED }}>no history</span>
          }
        </td>
        <td style={{ padding: '12px 14px', color: MUTED, fontSize: 12 }}>{open ? '▲ Hide' : '▼ Orders'}</td>
      </tr>

      {open && (
        <tr style={{ background: CARD3 }}>
          <td colSpan={6} style={{ padding: '0 0 2px' }}>
            {grouped.length === 0 ? (
              <div style={{ padding: '16px 20px', color: MUTED, fontSize: 13 }}>No linked order history found.</div>
            ) : (
              <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {grouped.map(([orderId, items]) => (
                  <div key={orderId} style={{ background: CARD, borderRadius: 10, overflow: 'hidden', border: '1px solid ' + BORDER }}>
                    {/* Order header */}
                    <div style={{ padding: '10px 16px', background: CARD2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid ' + BORDER }}>
                      <div>
                        <span style={{ fontSize: 11, color: MUTED }}>Order · </span>
                        <span style={{ fontSize: 11, color: SUB, fontFamily: 'monospace' }}>{orderId.slice(0, 20)}…</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: MUTED }}>{ago(items[0].order_date)}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>{$$(items[0].order_total_cents / 100, 2)}</span>
                      </div>
                    </div>
                    {/* Line items with album art */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', borderTop: idx > 0 ? '1px solid ' + BORDER : 'none' }}>
                          {/* Album art */}
                          <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: CARD2, border: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.cover_url ? (
                              <img src={item.cover_url} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: 22 }}>🎵</span>
                            )}
                          </div>
                          {/* Item details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.item_name}</div>
                            {item.artist_name && (
                              <div style={{ fontSize: 11, color: accent, marginTop: 1, fontWeight: 500 }}>{item.artist_name}</div>
                            )}
                            {item.variation_name && item.variation_name !== item.item_name && (
                              <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{item.variation_name}</div>
                            )}
                          </div>
                          {/* Price */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{$$(item.item_price_cents / 100, 2)}</div>
                            {item.quantity > 1 && <div style={{ fontSize: 10, color: MUTED }}>qty {item.quantity}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Inventory Browser ────────────────────────────────────────────────────────

function AlbumPlaceholder() {
  return (
    <div style={{ width: '100%', aspectRatio: '1', background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, borderRadius: 6 }}>🎵</div>
  )
}

function InventoryBrowser({
  items, accent, genreFilter, loading, onClearFilter,
}: {
  items: InventoryItem[]
  accent: string
  genreFilter: string | null
  loading?: boolean
  onClearFilter: () => void
}) {
  const [view, setView] = useState<'art' | 'detail'>('art')
  const [page, setPage] = useState(1)
  const PER_PAGE = 60

  // items are already filtered server-side when genreFilter is active
  const totalPages = Math.ceil(items.length / PER_PAGE)
  const paged = items.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // Reset page when items change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => setPage(1), [genreFilter])

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: CARD2, borderRadius: 8, overflow: 'hidden', border: '1px solid ' + BORDER }}>
          {(['art', 'detail'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '6px 16px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: view === v ? accent : 'transparent', color: view === v ? '#0f0f1a' : MUTED, transition: 'all 0.15s' }}>
              {v === 'art' ? '🖼 Art View' : '📋 Detail View'}
            </button>
          ))}
        </div>
        {loading ? (
          <span style={{ fontSize: 12, color: MUTED }}>Loading…</span>
        ) : (
          <span style={{ fontSize: 12, color: MUTED }}>
            {items.length} item{items.length !== 1 ? 's' : ''}
            {genreFilter ? ` in "${genreFilter}"` : ' total'}
          </span>
        )}
        {genreFilter && (
          <button
            onClick={onClearFilter}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: accent + '22', color: accent, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {genreFilter} <span style={{ fontSize: 13, lineHeight: 1 }}>×</span>
          </button>
        )}
      </div>

      {view === 'art' ? (
        /* Album Art Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {paged.map(item => (
            <div key={item.catalog_object_id} style={{ background: CARD, borderRadius: 10, overflow: 'hidden', border: '1px solid ' + BORDER, transition: 'border-color 0.15s' }}>
              {/* Art */}
              <div style={{ position: 'relative', aspectRatio: '1' }}>
                {item.cover_url ? (
                  <img src={item.cover_url} alt="album cover" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <AlbumPlaceholder />
                )}
                {/* Sold badge */}
                {item.times_sold > 0 && (
                  <div style={{ position: 'absolute', top: 6, right: 6, background: accent, color: '#0f0f1a', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20 }}>
                    {item.times_sold}× sold
                  </div>
                )}
              </div>
              {/* Info */}
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: TEXT, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {item.artist_name || item.name}
                </div>
                {item.artist_name && item.album_title && (
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.album_title}</div>
                )}
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {item.format && <Chip label={item.format} color={accent} />}
                  {item.condition && <Chip label={item.condition} color={SUB} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Detail Table */
        <div style={{ overflowX: 'auto', borderRadius: 8, background: CARD2 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Cover', 'Title / Artist', 'Format', 'Cond', 'Sold', 'Avg Price', 'Revenue'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: MUTED, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: CARD2, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(item => (
                <tr key={item.catalog_object_id} style={{ borderTop: '1px solid ' + BORDER }}>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 4, overflow: 'hidden', background: CARD, border: '1px solid ' + BORDER, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.cover_url
                        ? <img src={item.cover_url} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 16 }}>🎵</span>
                      }
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', maxWidth: 220 }}>
                    <div style={{ fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.artist_name || item.name}
                    </div>
                    {item.album_title && item.artist_name && (
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.album_title}</div>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', color: SUB }}>{item.format ?? '—'}</td>
                  <td style={{ padding: '8px 12px', color: SUB }}>{item.condition ?? '—'}</td>
                  <td style={{ padding: '8px 12px', color: item.times_sold > 0 ? accent : MUTED, fontWeight: item.times_sold > 0 ? 700 : 400 }}>{item.times_sold}</td>
                  <td style={{ padding: '8px 12px', color: TEXT }}>{item.avg_price_cents > 0 ? $$(item.avg_price_cents / 100, 2) : '—'}</td>
                  <td style={{ padding: '8px 12px', color: item.revenue_cents > 0 ? accent : MUTED, fontWeight: 600 }}>{item.revenue_cents > 0 ? $$(item.revenue_cents / 100) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 18, alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '5px 14px', border: '1px solid ' + BORDER, borderRadius: 6, background: 'transparent', color: page === 1 ? MUTED : TEXT, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12 }}>← Prev</button>
          <span style={{ color: MUTED, fontSize: 12 }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '5px 14px', border: '1px solid ' + BORDER, borderRadius: 6, background: 'transparent', color: page === totalPages ? MUTED : TEXT, cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12 }}>Next →</button>
        </div>
      )}
    </div>
  )
}

// ─── ALAN Dashboard ───────────────────────────────────────────────────────────

function AlanOverview({ kpis, sales, dow, accent }: { kpis: SquareKpis | null; sales: SalesByDate[]; dow: SalesByDow[]; accent: string }) {
  const totalRev    = kpis ? kpis.total_sales_cents / 100 : 0
  const totalOrders = sales.reduce((s, d) => s + d.order_count, 0)
  const avgOrder    = totalOrders > 0 ? totalRev / totalOrders : 0
  const totalUniq   = sales.reduce((s, d) => Math.max(s, d.unique_customers ?? 0), 0)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KpiCard label="Total Revenue"       value={$$(totalRev)}                  sub="All completed orders" accent={accent} />
        <KpiCard label="Total Orders"        value={num(totalOrders)}              sub="Last 60 days"         accent={accent} />
        <KpiCard label="Avg Order Value"     value={$$(avgOrder, 2)}               accent={accent} />
        <KpiCard label="Unique Items Sold"   value={num(kpis?.unique_items_sold)}  accent={accent} />
        <KpiCard label="Customers w/ Orders" value={num(kpis?.customer_count)}     accent={accent} />
      </div>

      <Section title="Daily Revenue — Last 60 Days">
        <RevenueChart data={sales} color={accent} />
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <Section title="Unique Customers — Last 60 Days">
          <div style={{ color: MUTED, fontSize: 11, marginBottom: 8 }}>
            Orders with linked customer IDs · {totalUniq} peak/day
          </div>
          <UniqueCustomersChart data={sales} color={accent} />
        </Section>

        <Section title="Sales by Day of Week">
          <DowChart data={dow} color={accent} />
        </Section>
      </div>
    </div>
  )
}

function AlanCustomers({ customers, stats, accent, orderHistory }: { customers: Customer[]; stats: CustomerStats | null; accent: string; orderHistory: CustomerOrderItem[] }) {
  // Index orders by customer_id for fast lookup
  const ordersByCustomer = useMemo(() => {
    const map = new Map<string, CustomerOrderItem[]>()
    orderHistory.forEach(o => {
      if (!map.has(o.customer_id)) map.set(o.customer_id, [])
      map.get(o.customer_id)!.push(o)
    })
    return map
  }, [orderHistory])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KpiCard label="Customers w/ Orders"   value={num(stats?.total_customers)}           accent={accent} />
        <KpiCard label="Total Linked Orders"   value={num(stats?.total_orders)}              accent={accent} />
        <KpiCard label="Avg Spend / Customer"  value={$$(stats?.avg_spend_per_customer, 2)}  accent={accent} />
        <KpiCard label="Avg Orders / Customer" value={stats?.avg_orders_per_customer?.toFixed(1) ?? '—'} accent={accent} />
      </div>

      <Section title="Top Customers — All-Time Spend (click to expand order history)">
        <div style={{ overflowX: 'auto', borderRadius: 8, background: CARD2 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['#', 'Customer', 'Orders', 'Total Spend', 'History', ''].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <CustomerRow
                  key={c.customer_id}
                  c={c}
                  rank={i}
                  accent={accent}
                  orders={ordersByCustomer.get(c.customer_id) ?? []}
                />
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: MUTED, fontSize: 11, marginTop: 10 }}>
          * Customer names/emails not yet synced — customer details table is empty. Only order-linked IDs shown.
        </p>
      </Section>
    </div>
  )
}

function AlanInventoryMix({ genres, inventoryItems, accent }: { genres: GenreRow[]; inventoryItems: InventoryItem[]; accent: string }) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [genreItems, setGenreItems]       = useState<InventoryItem[] | null>(null)
  const [loadingGenre, setLoadingGenre]   = useState(false)
  const top = genres.slice(0, 20)

  // Fetch filtered inventory server-side when genre is selected
  useEffect(() => {
    if (!selectedGenre) { setGenreItems(null); return }
    let cancelled = false
    setLoadingGenre(true)
    const sb = createClient()
    sb.rpc('get_mgmt_inventory_items', { p_genre: selectedGenre, p_page: 1, p_page_size: 500 })
      .then(({ data }) => {
        if (!cancelled) {
          setGenreItems((data as InventoryItem[]) ?? [])
          setLoadingGenre(false)
        }
      })
    return () => { cancelled = true }
  }, [selectedGenre])

  function handleGenreClick(label: string) {
    setSelectedGenre(g => g === label ? null : label)
  }

  function clearFilter() {
    setSelectedGenre(null)
    setGenreItems(null)
  }

  const displayItems = selectedGenre !== null && genreItems !== null ? genreItems : inventoryItems

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KpiCard label="Genres Tracked" value={String(genres.length)}                                                  accent={accent} />
        <KpiCard label="Units Sold"      value={num(genres.reduce((s, g) => s + g.times_sold, 0))}                     accent={accent} />
        <KpiCard label="Genre Revenue"   value={$$(genres.reduce((s, g) => s + g.revenue_cents, 0) / 100)}             accent={accent} />
        <KpiCard label="Top Genre"       value={genres[0]?.genre ?? '—'}                                               accent={accent} />
        <KpiCard label="Items in Catalog" value={num(inventoryItems[0]?.total_count ?? inventoryItems.length)}         accent={accent} />
      </div>

      {/* Genre Charts (clickable to filter) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
        <Section
          title="Units Sold by Genre (Top 20)"
          action={selectedGenre ? <button onClick={() => setSelectedGenre(null)} style={{ fontSize: 10, padding: '2px 8px', border: '1px solid ' + BORDER, borderRadius: 20, background: 'transparent', color: MUTED, cursor: 'pointer' }}>Clear filter</button> : undefined}
        >
          <div style={{ fontSize: 10, color: MUTED, marginBottom: 8 }}>Click a genre to filter the inventory below</div>
          <BarChart
            rows={top.map(g => ({ label: g.genre, value: g.times_sold }))}
            color={accent}
            onClickRow={handleGenreClick}
            selectedLabel={selectedGenre}
          />
        </Section>
        <Section title="Revenue by Genre (Top 20)">
          <div style={{ fontSize: 10, color: MUTED, marginBottom: 8 }}>Total revenue generated per genre</div>
          <BarChart
            rows={top.map(g => ({ label: g.genre, value: Math.round(g.revenue_cents / 100) }))}
            color={accent}
            onClickRow={handleGenreClick}
            selectedLabel={selectedGenre}
          />
        </Section>
      </div>

      {/* Inventory Browser */}
      <Section
        title={'Inventory Browser' + (selectedGenre ? ' — ' + selectedGenre.replace(/\b\w/g, c => c.toUpperCase()) : ' — All Items')}
        action={selectedGenre ? (
          <button onClick={clearFilter} style={{ fontSize: 11, padding: '3px 10px', border: '1px solid ' + accent + '44', borderRadius: 20, background: accent + '15', color: accent, cursor: 'pointer', fontWeight: 600 }}>
            ✕ Clear
          </button>
        ) : undefined}
      >
        <InventoryBrowser
          items={displayItems}
          accent={accent}
          genreFilter={selectedGenre}
          loading={loadingGenre}
          onClearFilter={clearFilter}
        />
      </Section>

      <div style={{ background: accent + '11', border: '1px solid ' + accent + '33', borderRadius: 10, padding: '12px 16px', marginTop: 18 }}>
        <strong style={{ color: accent, fontSize: 13 }}>💡 Genre Targets</strong>
        <p style={{ color: SUB, fontSize: 12, margin: '6px 0 0', lineHeight: 1.6 }}>
          Define target % per genre and we&apos;ll show actual vs. target with over/under alerts automatically.
        </p>
      </div>
    </div>
  )
}

function AlanWhatsWorking({ kpis, genres, sales, igSummary, fbSummary, accent }: { kpis: SquareKpis | null; genres: GenreRow[]; sales: SalesByDate[]; igSummary: IgSummary | null; fbSummary: FbSummary | null; accent: string }) {
  const igEngRate  = igSummary ? ((igSummary.avg_engagement / Math.max(igSummary.followers, 1)) * 100).toFixed(2) : null
  const recentRev  = sales.slice(-7).reduce((s, d) => s + d.total_money_cents, 0) / 100
  const prevRev    = sales.slice(-14, -7).reduce((s, d) => s + d.total_money_cents, 0) / 100
  const revTrend   = prevRev > 0 ? ((recentRev - prevRev) / prevRev * 100).toFixed(1) : null

  const wins = [
    genres[0] && genres[0].genre + ' is your top-selling genre with ' + num(genres[0].times_sold) + ' units sold',
    igSummary && 'Instagram averaging ' + Number(igSummary.avg_likes).toFixed(0) + ' likes/post — top post hit ' + num(igSummary.top_post_likes) + ' likes',
    fbSummary && 'Facebook page at ' + num(fbSummary.followers) + ' followers · ' + fbSummary.star_rating + '⭐ rating',
    revTrend && Number(revTrend) > 0 && 'Revenue up ' + revTrend + '% this week vs last week',
  ].filter(Boolean) as string[]

  const attention = [
    igEngRate && Number(igEngRate) < 3 && 'Instagram engagement rate at ' + igEngRate + '% — under 3% threshold',
    fbSummary && fbSummary.avg_clicks < 30 && 'Facebook avg ' + fbSummary.avg_clicks.toFixed(0) + ' clicks/post — consider boosting top content',
    genres.slice(-4).length > 0 && 'Low-velocity genres to promote: ' + genres.slice(-4).map(g => g.genre).join(', '),
    revTrend && Number(revTrend) < 0 && 'Revenue down ' + Math.abs(Number(revTrend)) + '% this week vs last — worth a look',
  ].filter(Boolean) as string[]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
        <div>
          <div style={{ color: '#10b981', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>✅ What&apos;s Working</div>
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
          <BarChart rows={genres.slice(0, 12).map(g => ({ label: g.genre, value: g.times_sold }))} color={accent} />
        </Section>
        <Section title="Revenue by Genre">
          <BarChart rows={genres.slice(0, 12).map(g => ({ label: g.genre, value: Math.round(g.revenue_cents / 100) }))} color={accent} />
        </Section>
      </div>
    </div>
  )
}

function BradAlerts({ genres, accent }: { genres: GenreRow[]; accent: string }) {
  const hot  = [...genres].sort((a, b) => b.times_sold - a.times_sold).slice(0, 5)
  const slow = genres.filter(g => g.times_sold <= 2).slice(0, 6)
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
    </div>
  )
}

function BradEvents() {
  return (
    <div style={{ background: CARD, borderRadius: 12, padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: TEXT, marginBottom: 8 }}>Events Tracker — Coming Soon</div>
      <p style={{ color: MUTED, fontSize: 13, maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.6 }}>
        Needs a data source for events (RSVPs, dates, capacity). Three options:
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { l: 'Option A', d: 'Manual entry form → Supabase events table', c: '#10b981' },
          { l: 'Option B', d: 'Square Events API (if Dead Wax uses it)',    c: '#f59e0b' },
          { l: 'Option C', d: 'Facebook Events RSVPs via API',              c: '#3b82f6' },
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
  const igLikes   = [...igPosts].sort((a, b) => new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime()).map(p => p.likes || 0)
  const fbClicks  = [...fbPosts].sort((a, b) => new Date(a.created_time).getTime() - new Date(b.created_time).getTime()).map(p => p.clicks || 0)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div style={{ background: CARD, borderRadius: 12, padding: '20px', borderTop: '3px solid #e1306c' }}>
          <div style={{ fontWeight: 700, color: '#e1306c', fontSize: 14, marginBottom: 14 }}>📸 Instagram @{igSummary?.username ?? 'deadwaxrecords'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <KpiCard label="Followers"      value={num(igSummary?.followers)}                              accent="#e1306c" />
            <KpiCard label="Avg Likes/Post" value={Number(igSummary?.avg_likes ?? 0).toFixed(0)}          accent="#e1306c" />
            <KpiCard label="Avg Comments"   value={Number(igSummary?.avg_comments ?? 0).toFixed(0)}       accent="#e1306c" />
            <KpiCard label="Avg Saves"      value={Number(igSummary?.avg_saves ?? 0).toFixed(0)}          accent="#e1306c" />
            <KpiCard label="Eng Rate"       value={igEngRate + '%'}                                        accent="#e1306c" />
            <KpiCard label="Top Post Likes" value={num(igSummary?.top_post_likes)}                        accent="#e1306c" />
          </div>
          <div style={{ color: MUTED, fontSize: 11, marginBottom: 6 }}>LIKES TREND (chronological)</div>
          <Sparkline data={igLikes} color="#e1306c" width={280} height={52} />
        </div>
        <div style={{ background: CARD, borderRadius: 12, padding: '20px', borderTop: '3px solid #1877f2' }}>
          <div style={{ fontWeight: 700, color: '#1877f2', fontSize: 14, marginBottom: 14 }}>👥 Facebook — {fbSummary?.page_name ?? 'Dead Wax Records'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <KpiCard label="Page Followers"  value={num(fbSummary?.followers)}                            accent="#1877f2" />
            <KpiCard label="Avg Clicks/Post" value={Number(fbSummary?.avg_clicks ?? 0).toFixed(0)}       accent="#1877f2" />
            <KpiCard label="Avg Reach/Post"  value={Number(fbSummary?.avg_reach ?? 0).toFixed(0)}        accent="#1877f2" />
            <KpiCard label="Avg Video Views" value={Number(fbSummary?.avg_video_views ?? 0).toFixed(0)}  accent="#1877f2" />
            <KpiCard label="Star Rating"     value={(fbSummary?.star_rating ?? '—') + ' ⭐'}             accent="#1877f2" />
            <KpiCard label="Posts Tracked"   value={num(fbSummary?.total_posts)}                          accent="#1877f2" />
          </div>
          <div style={{ color: MUTED, fontSize: 11, marginBottom: 6 }}>CLICKS TREND (chronological)</div>
          <Sparkline data={fbClicks} color="#1877f2" width={280} height={52} />
        </div>
      </div>

      {igReach.length > 0 && (
        <Section title={'Instagram Daily Reach (' + igReach.length + ' days)'}>
          <BarChart rows={igReach.map(r => ({ label: new Date(r.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: Number(r.reach) }))} color="#e1306c" />
        </Section>
      )}

      <Section title="Top Instagram Posts — by Engagement (click to expand)">
        <div style={{ overflowX: 'auto', borderRadius: 8, background: CARD2 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Posted', 'Type', 'Caption', '❤️', '💬', '🔖', '↗️', 'Total', ''].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: CARD2 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...igPosts].sort((a, b) => b.total_eng - a.total_eng).slice(0, 10).map(p => (
                <IgPostRow key={p.media_id} p={p} accent={accent} />
              ))}
            </tbody>
          </table>
        </div>
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

  const heads = view === 'ig'
    ? ['Posted', 'Type', 'Caption', '❤️', '💬', '🔖 Saved', '↗️', 'Total Eng', '']
    : ['Posted', 'Message', '🖱️ Clicks', '👁️ Reach', '🎬 Views', '❤️', '↗️', 'Total', '']

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
        <span style={{ color: MUTED, fontSize: 12 }}>Click any row to expand</span>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 8, background: CARD2 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {heads.map(h => (
                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: CARD2 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view === 'ig' && sortedIg.map(p => <IgPostRow key={p.media_id} p={p} accent={accent} />)}
            {view === 'fb' && sortedFb.map(p => <FbPostRow key={p.post_id} p={p} accent={accent} />)}
          </tbody>
        </table>
      </div>
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
  salesByDow, customerOrderHistory, inventoryItems,
}: Props) {
  const [role, setRole]       = useState<Role | null>(null)
  const [alanTab, setAlanTab] = useState<AlanTab>('overview')
  const [bradTab, setBradTab] = useState<BradTab>('inventory')
  const [samTab, setSamTab]   = useState<SamTab>('platforms')
  const router = useRouter()
  const accent = role ? ACCENT[role] : '#f59e0b'

  // Suppress unused var warning — inventoryFlatFacts kept for future use
  void inventoryFlatFacts

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
              <RoleCard name="Alan" role="Owner & Founder"         description="Revenue, top customers, inventory strategy, and performance signals." accentColor="#f59e0b" onSelect={() => setRole('alan')} />
              <RoleCard name="Brad" role="Operations & Inventory"  description="Inventory health, genre velocity, alerts, events tracker."             accentColor="#10b981" onSelect={() => setRole('brad')} />
              <RoleCard name="Sam"  role="Social Media Manager"    description="Post tracker, platform analytics, and engagement trends."               accentColor="#a855f7" onSelect={() => setRole('sam')} />
            </div>
          </div>
        )}

        {/* Alan */}
        {role === 'alan' && (
          <div>
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid ' + BORDER, marginBottom: 24, marginTop: 20, overflowX: 'auto' }}>
              <TabBtn active={alanTab === 'overview'}       onClick={() => setAlanTab('overview')}       accent={accent}>📊 Overview</TabBtn>
              <TabBtn active={alanTab === 'customers'}      onClick={() => setAlanTab('customers')}      accent={accent}>👥 Customers</TabBtn>
              <TabBtn active={alanTab === 'inventory-mix'}  onClick={() => setAlanTab('inventory-mix')}  accent={accent}>🎵 Inventory Mix</TabBtn>
              <TabBtn active={alanTab === 'whats-working'}  onClick={() => setAlanTab('whats-working')}  accent={accent}>✅ What&apos;s Working</TabBtn>
            </div>
            {alanTab === 'overview'      && <AlanOverview kpis={squareKpis} sales={squareSalesByDate} dow={salesByDow} accent={accent} />}
            {alanTab === 'customers'     && <AlanCustomers customers={topCustomers} stats={customerStats} accent={accent} orderHistory={customerOrderHistory} />}
            {alanTab === 'inventory-mix' && <AlanInventoryMix genres={squareCatalogByGenre} inventoryItems={inventoryItems} accent={accent} />}
            {alanTab === 'whats-working' && <AlanWhatsWorking kpis={squareKpis} genres={squareCatalogByGenre} sales={squareSalesByDate} igSummary={igSummary} fbSummary={fbSummary} accent={accent} />}
          </div>
        )}

        {/* Brad */}
        {role === 'brad' && (
          <div>
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid ' + BORDER, marginBottom: 24, marginTop: 20 }}>
              <TabBtn active={bradTab === 'inventory'} onClick={() => setBradTab('inventory')} accent={accent}>📦 Inventory Health</TabBtn>
              <TabBtn active={bradTab === 'events'}    onClick={() => setBradTab('events')}    accent={accent}>📅 Events</TabBtn>
              <TabBtn active={bradTab === 'alerts'}    onClick={() => setBradTab('alerts')}    accent={accent}>🚨 Alerts</TabBtn>
            </div>
            {bradTab === 'inventory' && <BradInventory invKpis={inventoryKpis} genres={squareCatalogByGenre} accent={accent} />}
            {bradTab === 'events'    && <BradEvents />}
            {bradTab === 'alerts'    && <BradAlerts genres={squareCatalogByGenre} accent={accent} />}
          </div>
        )}

        {/* Sam */}
        {role === 'sam' && (
          <div>
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid ' + BORDER, marginBottom: 24, marginTop: 20 }}>
              <TabBtn active={samTab === 'platforms'}    onClick={() => setSamTab('platforms')}    accent={accent}>📊 Platforms</TabBtn>
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
