'use client'

/**
 * Dead Wax Records — Management Dashboard (Client Component)
 * Johnny Outlaw, LLC — Designed in Rockwall, TX
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

interface Props {
  squareSummary: SquareSummary | null
  squareTopItems: TopItem[]
  recentPayments: Payment[]
  instagramMedia: InstagramMedia[]
  instagramAccount: InstagramAccount | null
  instagramDemographics: DemographicRow[]
  facebookPosts: FacebookPost[]
  dbStats: DbStatRow[]
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

function SquarePanel({ summary, topItems, payments }: {
  summary: SquareSummary | null
  topItems: TopItem[]
  payments: Payment[]
}) {
  return (
    <div className="flex flex-col gap-6">

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Revenue"
          value={summary ? fmtMoney(summary.total_revenue) : '—'}
          sub="completed orders"
          accent
        />
        <StatCard
          label="Orders"
          value={summary?.total_orders?.toLocaleString() ?? '—'}
          sub="completed"
        />
        <StatCard
          label="Avg Order"
          value={summary ? fmtMoney(Math.round(summary.avg_order)) : '—'}
          sub="per transaction"
        />
        <StatCard
          label="Last Sale"
          value={summary?.last_order ? fmtRelative(summary.last_order) : '—'}
          sub={summary?.last_order ? fmtDate(summary.last_order) : undefined}
        />
      </div>

      {/* Top Items */}
      <section>
        <SectionHeader right={`top ${topItems.length} by revenue`}>🏆 Top Selling Items</SectionHeader>
        <div className="rounded-xl overflow-hidden border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left px-4 py-2.5 font-medium text-text-muted">Item</th>
                <th className="text-right px-4 py-2.5 font-medium text-text-muted hidden sm:table-cell">Sold</th>
                <th className="text-right px-4 py-2.5 font-medium text-text-muted">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item, i) => (
                <tr key={i} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}>
                  <td className="px-4 py-3 text-text-primary font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-right text-text-muted hidden sm:table-cell">{item.times_sold.toLocaleString()}×</td>
                  <td className="px-4 py-3 text-right font-semibold text-text-primary">{fmtMoney(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Payments */}
      <section>
        <SectionHeader right={`last ${payments.length}`}>💳 Recent Payments</SectionHeader>
        <div className="rounded-xl overflow-hidden border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="text-left px-4 py-2.5 font-medium text-text-muted">Amount</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-muted hidden sm:table-cell">Method</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-muted hidden md:table-cell">Note</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-muted">When</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-muted hidden lg:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.payment_id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-background' : 'bg-surface'}`}>
                  <td className="px-4 py-3 font-semibold text-text-primary">{fmtMoney(p.total_money)}</td>
                  <td className="px-4 py-3 text-text-muted hidden sm:table-cell">
                    {p.source_type === 'CASH' ? 'Cash' : p.card_brand ? `${p.card_brand} ···${p.last_4}` : p.source_type}
                  </td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell">{truncate(p.note, 40)}</td>
                  <td className="px-4 py-3 text-text-muted">{fmtRelative(p.created_at)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: p.status === 'COMPLETED' ? '#1a2e1a' : '#2e1a1a',
                        color: p.status === 'COMPLETED' ? '#4ade80' : '#f87171',
                      }}>
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

const DB_CATEGORIES: { label: string; icon: string; tables: string[] }[] = [
  { label: 'Square — Commerce', icon: '🛒', tables: ['square_catalog_items', 'square_orders', 'square_order_line_items', 'square_payments', 'square_customers', 'square_invoices', 'square_merchants', 'square_locations'] },
  { label: 'Instagram', icon: '📸', tables: ['instagram_media', 'instagram_media_insights', 'instagram_demographics', 'instagram_account_history', 'instagram_insights'] },
  { label: 'Facebook', icon: '👥', tables: ['facebook_posts', 'facebook_post_metrics'] },
  { label: 'TikTok', icon: '🎵', tables: ['tiktok_videos', 'tiktok_video_snapshots', 'tiktok_accounts'] },
]

function DatabasePanel({ stats }: { stats: DbStatRow[] }) {
  const byTable = Object.fromEntries(stats.map(r => [r.table_name, r]))
  const totalRows = stats.reduce((s, r) => s + Number(r.row_count), 0)
  const totalBytes = stats.reduce((s, r) => s + Number(r.size_bytes), 0)

  function fmtSize(bytes: number) {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} kB`
    return `${bytes} B`
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Rows" value={totalRows.toLocaleString()} sub="live records" accent />
        <StatCard label="Total Size" value={fmtSize(totalBytes)} sub="on disk" />
        <StatCard label="Tables" value={stats.length} sub="outlaw_data + johnny_outlaw" />
      </div>

      {DB_CATEGORIES.map(cat => {
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
                  </tr>
                </thead>
                <tbody>
                  {cat.tables.map((tableName, i) => {
                    const row = byTable[tableName]
                    const rows = row ? Number(row.row_count) : 0
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

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'square' | 'instagram' | 'facebook' | 'tiktok' | 'database'

export default function DeadWaxClient({
  squareSummary, squareTopItems, recentPayments,
  instagramMedia, instagramAccount, instagramDemographics,
  facebookPosts, dbStats, userEmail,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('square')
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
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold text-sm text-white">DW</div>
          <div>
            <h1 className="font-bold text-text-primary leading-none">Dead Wax Records</h1>
            <p className="text-xs text-text-muted leading-none mt-0.5">Management Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-text-muted hidden sm:block">Johnny Outlaw, LLC — Designed in Rockwall, TX</span>
          <button onClick={handleSignOut} className="text-xs text-text-muted hover:text-accent transition-colors">Sign out</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">

        {/* Tabs */}
        <section>
          <div className="flex gap-2 mb-6 flex-wrap">
            <TabButton active={activeTab === 'square'}   onClick={() => setActiveTab('square')}>🛒 Square</TabButton>
            <TabButton active={activeTab === 'instagram'} onClick={() => setActiveTab('instagram')}>📸 Instagram</TabButton>
            <TabButton active={activeTab === 'facebook'} onClick={() => setActiveTab('facebook')}>👥 Facebook</TabButton>
            <TabButton active={activeTab === 'tiktok'}   onClick={() => setActiveTab('tiktok')}>🎵 TikTok</TabButton>
            <TabButton active={activeTab === 'database'} onClick={() => setActiveTab('database')}>🗄️ Database</TabButton>
          </div>

          {activeTab === 'square' && (
            <SquarePanel summary={squareSummary} topItems={squareTopItems} payments={recentPayments} />
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
            <DatabasePanel stats={dbStats} />
          )}
        </section>

      </main>
    </div>
  )
}
