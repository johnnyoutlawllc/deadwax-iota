'use client'

/**
 * Dead Wax Records — Catalog Overview
 * Johnny Outlaw, LLC — Designed in Rockwall, TX
 *
 * Auto-categorizes catalog items by format, condition, and sales performance.
 * Blends Square catalog with order line-item data.
 */

import { useMemo, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatalogData {
  summary: {
    total_active:  number
    named_titles:  number
    generic_stock: number
    with_sales:    number
    zero_sales:    number
    total_revenue: number
    total_sold:    number
  }
  format_breakdown: {
    format:        string
    item_count:    number
    total_sold:    number
    total_revenue: number
  }[]
  condition_breakdown: {
    condition:     string
    item_count:    number
    total_sold:    number
    total_revenue: number
  }[]
  tiers: {
    hot:     number
    selling: number
    zero:    number
  }
  top_named_sellers: {
    name:       string
    times_sold: number
    revenue:    number
    fmt:        string
  }[]
  top_generic_sellers: {
    name:       string
    times_sold: number
    revenue:    number
    fmt:        string
    cond:       string
  }[]
  zero_sales_named: {
    name:       string
    fmt:        string
    updated_at: string | null
  }[]
  format_condition: {
    format:        string
    condition:     string
    item_count:    number
    total_sold:    number
    total_revenue: number
  }[]
}

interface Props {
  data: CatalogData
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(cents: number) {
  if (!cents) return '$0'
  if (cents >= 100000) return `$${(cents / 100000).toFixed(1)}k`
  return `$${(cents / 100).toFixed(2)}`
}

function fmtBigMoney(cents: number) {
  if (!cents) return '$0'
  const d = cents / 100
  if (d >= 1000) return `$${(d / 1000).toFixed(1)}k`
  return `$${d.toFixed(0)}`
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const FORMAT_COLORS: Record<string, string> = {
  'Vinyl / LP': '#ff6b35',
  'CD':         '#60a5fa',
  'Cassette':   '#a78bfa',
  '7" Single':  '#34d399',
  'Gift Card':  '#fbbf24',
  'Equipment':  '#f87171',
  'Other':      '#6b7280',
}

// ─── Shared small components ──────────────────────────────────────────────────

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

function SectionHeader({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">{children}</h3>
      {right && <span className="text-xs text-text-muted">{right}</span>}
    </div>
  )
}

function FormatBadge({ fmt }: { fmt: string }) {
  const color = FORMAT_COLORS[fmt] ?? '#6b7280'
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
      style={{ background: color + '22', color, border: `1px solid ${color}44` }}>
      {fmt}
    </span>
  )
}

// ─── Format Breakdown Bar ─────────────────────────────────────────────────────

function FormatBreakdown({ rows }: { rows: CatalogData['format_breakdown'] }) {
  const maxSold = Math.max(...rows.map(r => r.total_sold))

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface border-b border-border">
            <th className="text-left px-4 py-2.5 text-text-muted font-medium">Format</th>
            <th className="text-right px-4 py-2.5 text-text-muted font-medium hidden sm:table-cell">Items</th>
            <th className="px-4 py-2.5 text-text-muted font-medium w-48 hidden md:table-cell">Units Sold</th>
            <th className="text-right px-4 py-2.5 text-text-muted font-medium">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const color = FORMAT_COLORS[row.format] ?? '#6b7280'
            const pct = maxSold > 0 ? (row.total_sold / maxSold) * 100 : 0
            return (
              <tr key={row.format}
                className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="font-medium text-text-primary">{row.format}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-text-muted hidden sm:table-cell">
                  {row.item_count.toLocaleString()}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-xs text-text-muted w-12 text-right tabular-nums">
                      {row.total_sold.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-text-primary">
                  {fmtBigMoney(row.total_revenue)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Performance Tiers ────────────────────────────────────────────────────────

function PerformanceTiers({ tiers, total }: { tiers: CatalogData['tiers']; total: number }) {
  const segments = [
    { label: 'Hot',      key: 'hot',     count: tiers.hot,     icon: '🔥', color: '#ef4444', desc: '10+ sales' },
    { label: 'Selling',  key: 'selling', count: tiers.selling, icon: '✅', color: '#22c55e', desc: '1–9 sales' },
    { label: 'Zero Sales', key: 'zero',  count: tiers.zero,    icon: '💤', color: '#6b7280', desc: 'no sales yet' },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Visual bar */}
      <div className="flex h-4 rounded-full overflow-hidden gap-px">
        {segments.map(s => {
          const pct = total > 0 ? (s.count / total) * 100 : 0
          return pct > 0 ? (
            <div key={s.key} className="h-full transition-all" title={`${s.label}: ${s.count}`}
              style={{ width: `${pct}%`, background: s.color }} />
          ) : null
        })}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-3">
        {segments.map(s => {
          const pct = total > 0 ? ((s.count / total) * 100).toFixed(1) : '0'
          return (
            <div key={s.key} className="rounded-xl p-4 border border-border bg-surface flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span>{s.icon}</span>
                <span className="text-xs uppercase tracking-widest text-text-muted">{s.label}</span>
              </div>
              <span className="text-2xl font-bold text-text-primary">{s.count.toLocaleString()}</span>
              <span className="text-xs text-text-muted">{pct}% of catalog · {s.desc}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Cross-Tab: Format × Condition ───────────────────────────────────────────

function FormatConditionGrid({ rows }: { rows: CatalogData['format_condition'] }) {
  const formats    = [...new Set(rows.map(r => r.format))]
  const conditions = [...new Set(rows.map(r => r.condition))]
  const lookup = Object.fromEntries(
    rows.map(r => [`${r.format}__${r.condition}`, r])
  )
  const maxSold = Math.max(...rows.map(r => r.total_sold))

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface border-b border-border">
            <th className="text-left px-3 py-2.5 text-text-muted font-medium">Format</th>
            {conditions.map(c => (
              <th key={c} className="text-right px-3 py-2.5 text-text-muted font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {formats.map((fmt, i) => (
            <tr key={fmt} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}>
              <td className="px-3 py-2.5">
                <FormatBadge fmt={fmt} />
              </td>
              {conditions.map(cond => {
                const cell = lookup[`${fmt}__${cond}`]
                const intensity = cell && maxSold > 0 ? cell.total_sold / maxSold : 0
                return (
                  <td key={cond} className="px-3 py-2.5 text-right">
                    {cell ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-semibold tabular-nums"
                          style={{ color: `rgba(255,107,53,${0.4 + intensity * 0.6})` }}>
                          {cell.total_sold.toLocaleString()} sold
                        </span>
                        <span className="text-text-muted">{cell.item_count.toLocaleString()} items</span>
                      </div>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Top Sellers Table ────────────────────────────────────────────────────────

function TopSellersTable({ items, showFmt = true }: {
  items: { name: string; times_sold: number; revenue: number; fmt: string }[]
  showFmt?: boolean
}) {
  const maxSold = Math.max(...items.map(i => i.times_sold))

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface border-b border-border">
            <th className="text-left px-4 py-2.5 text-text-muted font-medium">#</th>
            <th className="text-left px-4 py-2.5 text-text-muted font-medium">Title</th>
            {showFmt && <th className="text-left px-4 py-2.5 text-text-muted font-medium hidden md:table-cell">Format</th>}
            <th className="px-4 py-2.5 text-text-muted font-medium w-40 hidden sm:table-cell">Sales</th>
            <th className="text-right px-4 py-2.5 text-text-muted font-medium">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const pct = maxSold > 0 ? (item.times_sold / maxSold) * 100 : 0
            const color = FORMAT_COLORS[item.fmt] ?? '#ff6b35'
            return (
              <tr key={i}
                className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}>
                <td className="px-4 py-3 text-text-muted font-mono">{i + 1}</td>
                <td className="px-4 py-3 text-text-primary font-medium max-w-xs truncate">{item.name}</td>
                {showFmt && (
                  <td className="px-4 py-3 hidden md:table-cell"><FormatBadge fmt={item.fmt} /></td>
                )}
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-xs text-text-muted tabular-nums w-8 text-right">
                      {item.times_sold}×
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-text-primary">
                  {fmtMoney(item.revenue)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Zero-Sales Grid ──────────────────────────────────────────────────────────

function ZeroSalesGrid({ items }: { items: CatalogData['zero_sales_named'] }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? items : items.slice(0, 16)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {shown.map((item, i) => {
          const color = FORMAT_COLORS[item.fmt] ?? '#6b7280'
          return (
            <div key={i}
              className="rounded-lg px-3 py-2 border text-xs flex items-center gap-2"
              style={{ background: '#0f0f0f', borderColor: '#1e1e1e' }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-text-secondary max-w-48 truncate">{item.name}</span>
              {item.updated_at && (
                <span className="text-text-muted opacity-50">{fmtDate(item.updated_at)}</span>
              )}
            </div>
          )
        })}
      </div>
      {items.length > 16 && (
        <button onClick={() => setExpanded(!expanded)}
          className="text-xs text-text-muted hover:text-accent transition-colors self-start">
          {expanded ? '↑ Show less' : `↓ Show all ${items.length} items`}
        </button>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CatalogOverview({ data }: Props) {
  const s = data.summary
  const totalActive = s.total_active

  const sellThruPct = totalActive > 0
    ? ((s.with_sales / totalActive) * 100).toFixed(1)
    : '0'

  return (
    <div className="flex flex-col gap-8">

      {/* ── Summary ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Active Items"
          value={totalActive.toLocaleString()}
          sub={`${s.named_titles.toLocaleString()} named titles`}
          accent
        />
        <StatCard
          label="Items w/ Sales"
          value={s.with_sales.toLocaleString()}
          sub={`${sellThruPct}% sell-through`}
        />
        <StatCard
          label="Total Units Sold"
          value={s.total_sold.toLocaleString()}
          sub="across all catalog"
        />
        <StatCard
          label="Catalog Revenue"
          value={fmtBigMoney(s.total_revenue)}
          sub="from catalog items"
        />
      </div>

      {/* ── Performance Tiers ────────────────────────────────────────── */}
      <section>
        <SectionHeader>📊 Sales Performance</SectionHeader>
        <PerformanceTiers tiers={data.tiers} total={totalActive} />
      </section>

      {/* ── Format Breakdown ─────────────────────────────────────────── */}
      <section>
        <SectionHeader right={`${data.format_breakdown.length} categories`}>
          🎵 By Format
        </SectionHeader>
        <FormatBreakdown rows={data.format_breakdown} />
      </section>

      {/* ── Format × Condition cross-tab ─────────────────────────────── */}
      <section>
        <SectionHeader>🔀 Format × Condition</SectionHeader>
        <FormatConditionGrid rows={data.format_condition} />
      </section>

      {/* ── Top Named Sellers + Generic side by side ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <SectionHeader right={`top ${data.top_named_sellers?.length ?? 0}`}>
            🏆 Top Named Titles
          </SectionHeader>
          {data.top_named_sellers?.length > 0
            ? <TopSellersTable items={data.top_named_sellers} />
            : <p className="text-sm text-text-muted">No data yet.</p>
          }
        </section>

        <section>
          <SectionHeader right={`top ${data.top_generic_sellers?.length ?? 0}`}>
            📦 Generic Stock
          </SectionHeader>
          {data.top_generic_sellers?.length > 0
            ? <TopSellersTable items={data.top_generic_sellers} showFmt={false} />
            : <p className="text-sm text-text-muted">No data yet.</p>
          }
        </section>
      </div>

      {/* ── Zero-Sales Named Titles ───────────────────────────────────── */}
      <section>
        <SectionHeader right={`${s.zero_sales} total zero-sale items`}>
          💤 Named Titles with No Sales (recent additions)
        </SectionHeader>
        {data.zero_sales_named?.length > 0
          ? <ZeroSalesGrid items={data.zero_sales_named} />
          : <p className="text-sm text-text-muted">Everything is selling — nice.</p>
        }
      </section>

    </div>
  )
}
