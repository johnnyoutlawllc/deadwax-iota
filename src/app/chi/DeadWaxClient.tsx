'use client'

/**
 * Dead Wax Records — Management Dashboard (Client Component)
 * Johnny Outlaw, LLC — Designed in Rockwall, TX
 */

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccountHistory {
  account_id: string
  username: string
  followers_count: number
  media_count: number
  updated: string
}

interface InsightRow {
  account_id: string
  metric: string
  value: number
  period: string
  date: string
}

interface MediaItem {
  media_id: string
  account_id: string
  caption: string | null
  media_type: string
  timestamp: string
}

interface CatalogItem {
  catalog_object_id: string
  name: string | null
  description: string | null
  is_archived: boolean
  updated_at: string | null
}

interface Payment {
  payment_id: string
  amount_money: number
  total_money: number
  source_type: string
  created_at: string
  status: string
  card_brand: string | null
  last_4: string | null
}

interface DbStatRow {
  schema_name: string
  table_name: string
  row_count: number
  size_pretty: string
  size_bytes: number
}

interface Props {
  accountHistory: AccountHistory[]
  recentInsights: InsightRow[]
  recentMedia: MediaItem[]
  catalogItems: CatalogItem[]
  catalogCount: number
  recentPayments: Payment[]
  dbStats: DbStatRow[]
  userEmail: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 1000 / 60 / 60)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function truncate(str: string | null, max = 100) {
  if (!str) return '—'
  return str.length > max ? str.slice(0, max) + '…' : str
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Inventory Panel ──────────────────────────────────────────────────────────

function InventoryPanel({ items, totalCount }: { items: CatalogItem[]; totalCount: number }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(i =>
      i.name?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
    )
  }, [items, search])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search inventory…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 rounded-lg px-4 py-2 text-sm text-text-primary bg-surface border border-border focus:border-accent outline-none transition-colors"
        />
        <span className="text-sm whitespace-nowrap text-text-muted">
          {search
            ? `${filtered.length} match${filtered.length !== 1 ? 'es' : ''}`
            : `${totalCount.toLocaleString()} items`}
        </span>
      </div>

      <div className="rounded-xl overflow-hidden border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-text-muted">Name</th>
              <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">Description</th>
              <th className="text-left px-4 py-3 font-medium text-text-muted hidden lg:table-cell">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-12 text-text-muted">No items found</td>
              </tr>
            ) : (
              filtered.map((item, i) => (
                <tr
                  key={item.catalog_object_id}
                  className={`border-b border-border last:border-0 hover:bg-surface-hover transition-colors ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}
                >
                  <td className="px-4 py-3 text-text-primary font-medium">{item.name ?? '—'}</td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell">{truncate(item.description)}</td>
                  <td className="px-4 py-3 text-text-muted hidden lg:table-cell">
                    {item.updated_at ? formatRelative(item.updated_at) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length >= 100 && !search && (
        <p className="text-xs text-center text-text-muted">
          Showing 100 of {totalCount.toLocaleString()} items — use search to filter
        </p>
      )}
    </div>
  )
}

// ─── Social Panel ─────────────────────────────────────────────────────────────

function SocialPanel({ accountHistory, recentInsights, recentMedia, recentPayments }: {
  accountHistory: AccountHistory[]
  recentInsights: InsightRow[]
  recentMedia: MediaItem[]
  recentPayments: Payment[]
}) {
  const latest = accountHistory[0]
  const previous = accountHistory[1]
  const followerDelta = latest && previous ? latest.followers_count - previous.followers_count : null
  const latestReach = recentInsights[0]?.value ?? null

  return (
    <div className="flex flex-col gap-6">

      {/* Instagram Stats */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
          Instagram — @{latest?.username ?? 'dead_wax_dallas'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            label="Followers"
            value={latest?.followers_count?.toLocaleString() ?? '—'}
            sub={followerDelta !== null ? `${followerDelta >= 0 ? '+' : ''}${followerDelta} since yesterday` : undefined}
            accent
          />
          <StatCard label="Posts" value={latest?.media_count?.toLocaleString() ?? '—'} sub="total media" />
          <StatCard
            label="Daily Reach"
            value={latestReach !== null ? Number(latestReach).toLocaleString() : '—'}
            sub={recentInsights[0]?.date ? formatDate(recentInsights[0].date) : undefined}
          />
        </div>
      </section>

      {/* Reach Bar Chart */}
      {recentInsights.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
            Reach — Last 7 Days
          </h3>
          <div className="rounded-xl p-4 flex items-end gap-2 h-28 bg-surface border border-border">
            {[...recentInsights].reverse().map((row, i) => {
              const maxVal = Math.max(...recentInsights.map(r => Number(r.value)))
              const pct = maxVal > 0 ? (Number(row.value) / maxVal) * 100 : 0
              const isLatest = i === recentInsights.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${Math.max(pct, 4)}%`,
                      background: isLatest ? '#ff6b35' : '#2a2a2a',
                      minHeight: 4,
                    }}
                    title={`${Number(row.value).toLocaleString()} reach`}
                  />
                  <span className="text-xs text-text-muted">
                    {new Date(row.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Recent Posts */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
          Recent Posts
        </h3>
        <div className="flex flex-col gap-2">
          {recentMedia.map(post => (
            <div key={post.media_id} className="rounded-xl p-4 bg-surface border border-border flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-text-muted font-medium">
                  {post.media_type}
                </span>
                <span className="text-xs text-text-muted">{formatRelative(post.timestamp)}</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{truncate(post.caption, 120)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Sales */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
          Recent Square Sales
        </h3>
        <div className="rounded-xl overflow-hidden border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-text-muted">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden sm:table-cell">Method</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">When</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p, i) => (
                <tr
                  key={p.payment_id}
                  className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}
                >
                  <td className="px-4 py-3 font-semibold text-text-primary">{formatMoney(p.total_money)}</td>
                  <td className="px-4 py-3 text-text-muted hidden sm:table-cell">
                    {p.source_type === 'CASH' ? 'Cash' : p.card_brand ? `${p.card_brand} ···${p.last_4}` : p.source_type}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatRelative(p.created_at)}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: p.status === 'COMPLETED' ? '#1a2e1a' : '#2e1a1a',
                        color: p.status === 'COMPLETED' ? '#4ade80' : '#f87171',
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

// ─── Database Panel ───────────────────────────────────────────────────────────

const DB_CATEGORIES: { label: string; icon: string; tables: string[] }[] = [
  {
    label: 'Square — Commerce',
    icon: '🛒',
    tables: ['square_catalog_items', 'square_orders', 'square_order_line_items', 'square_payments', 'square_customers', 'square_invoices', 'square_merchants', 'square_locations'],
  },
  {
    label: 'Instagram',
    icon: '📸',
    tables: ['instagram_media', 'instagram_media_insights', 'instagram_demographics', 'instagram_account_history', 'instagram_insights'],
  },
  {
    label: 'Facebook',
    icon: '👥',
    tables: ['facebook_posts', 'facebook_post_metrics'],
  },
  {
    label: 'TikTok',
    icon: '🎵',
    tables: ['tiktok_videos', 'tiktok_video_snapshots', 'tiktok_accounts'],
  },
  {
    label: 'Internal — Johnny Outlaw',
    icon: '🏢',
    tables: ['client_accounts', 'clients'],
  },
]

function DatabasePanel({ stats }: { stats: DbStatRow[] }) {
  const byTable = Object.fromEntries(stats.map(r => [r.table_name, r]))
  const totalRows = stats.reduce((sum, r) => sum + Number(r.row_count), 0)
  const totalBytes = stats.reduce((sum, r) => sum + Number(r.size_bytes), 0)

  function fmtSize(bytes: number) {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} kB`
    return `${bytes} B`
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Tables" value={stats.length} sub="across all schemas" />
        <StatCard label="Total Rows" value={totalRows.toLocaleString()} sub="live records" accent />
        <StatCard label="Total Size" value={fmtSize(totalBytes)} sub="on disk" />
        <StatCard label="Schemas" value="outlaw_data + johnny_outlaw" sub="2 schemas" />
      </div>

      {/* Per-category breakdown */}
      {DB_CATEGORIES.map(cat => {
        const catStats = cat.tables.map(t => byTable[t]).filter(Boolean)
        const catRows = catStats.reduce((s, r) => s + Number(r.row_count), 0)
        const catBytes = catStats.reduce((s, r) => s + Number(r.size_bytes), 0)
        const hasData = catRows > 0

        return (
          <section key={cat.label}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">
                {cat.icon} {cat.label}
              </h3>
              <span className="text-xs text-text-muted">
                {catRows.toLocaleString()} rows · {fmtSize(catBytes)}
              </span>
            </div>
            <div className="rounded-xl overflow-hidden border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface border-b border-border">
                    <th className="text-left px-4 py-2.5 font-medium text-text-muted">Table</th>
                    <th className="text-right px-4 py-2.5 font-medium text-text-muted">Rows</th>
                    <th className="text-right px-4 py-2.5 font-medium text-text-muted hidden sm:table-cell">Size</th>
                    <th className="text-right px-4 py-2.5 font-medium text-text-muted hidden md:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.tables.map((tableName, i) => {
                    const row = byTable[tableName]
                    const rows = row ? Number(row.row_count) : 0
                    const populated = rows > 0
                    return (
                      <tr
                        key={tableName}
                        className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-text-secondary">{tableName}</td>
                        <td className={`px-4 py-3 text-right font-semibold tabular-nums ${populated ? 'text-text-primary' : 'text-text-muted'}`}>
                          {rows.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-text-muted hidden sm:table-cell">
                          {row?.size_pretty ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: populated ? '#1a2e1a' : '#1e1e1e',
                              color: populated ? '#4ade80' : '#555',
                            }}
                          >
                            {populated ? 'has data' : 'empty'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {catStats.length === 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center text-text-muted text-xs">No stats available</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DeadWaxClient({
  accountHistory, recentInsights, recentMedia, catalogItems, catalogCount, recentPayments, dbStats, userEmail,
}: Props) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'social' | 'database'>('inventory')
  const router = useRouter()

  const latest = accountHistory[0]
  const latestReach = recentInsights[0]?.value ?? null
  const latestPayment = recentPayments[0]

  async function handleSignOut() {
    // Standard Outlaw pattern: server-side sign-out via POST route
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/chi/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-background border-b border-border backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold text-sm text-white">
            DW
          </div>
          <div>
            <h1 className="font-bold text-text-primary leading-none">Dead Wax Records</h1>
            <p className="text-xs text-text-muted leading-none mt-0.5">Management Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-text-muted hidden sm:block">
            Johnny Outlaw, LLC — Designed in Rockwall, TX
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs text-text-muted hover:text-accent transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">

        {/* Top Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Followers"
            value={latest?.followers_count?.toLocaleString() ?? '—'}
            sub="@dead_wax_dallas"
            accent
          />
          <StatCard
            label="Daily Reach"
            value={latestReach !== null ? Number(latestReach).toLocaleString() : '—'}
            sub="yesterday"
          />
          <StatCard
            label="Active Inventory"
            value={catalogCount.toLocaleString()}
            sub="catalog items"
          />
          <StatCard
            label="Last Sale"
            value={latestPayment ? formatMoney(latestPayment.total_money) : '—'}
            sub={latestPayment ? formatRelative(latestPayment.created_at) : undefined}
          />
        </section>

        {/* Tabs */}
        <section>
          <div className="flex gap-2 mb-6 flex-wrap">
            <TabButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')}>
              🎵 Inventory
            </TabButton>
            <TabButton active={activeTab === 'social'} onClick={() => setActiveTab('social')}>
              📊 Social & Sales
            </TabButton>
            <TabButton active={activeTab === 'database'} onClick={() => setActiveTab('database')}>
              🗄️ Database
            </TabButton>
          </div>

          {activeTab === 'inventory' && (
            <InventoryPanel items={catalogItems} totalCount={catalogCount} />
          )}
          {activeTab === 'social' && (
            <SocialPanel
              accountHistory={accountHistory}
              recentInsights={recentInsights}
              recentMedia={recentMedia}
              recentPayments={recentPayments}
            />
          )}
          {activeTab === 'database' && (
            <DatabasePanel stats={dbStats} />
          )}
        </section>

      </main>
    </div>
  )
}
