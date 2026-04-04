'use client'

/**
 * Dead Wax Records — Strategy & Operations Dashboard (Client Component)
 * Johnny Outlaw, LLC — Designed in Rockwall, TX
 *
 * Role-based dashboard: Alan (Owner), Brad (Operations), Sam (Social)
 * Phase 1: Scaffolding with placeholders — real data wired in subsequent sessions
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'alan' | 'brad' | 'sam'

type AlanTab = 'overview' | 'loyalty' | 'inventory-mix' | 'whats-working'
type BradTab  = 'events' | 'inventory' | 'set-builder' | 'alerts'
type SamTab   = 'post-tracker' | 'platforms' | 'from-brad'

// ─── Status pill component ────────────────────────────────────────────────────

type StatusType = 'ready' | 'partial' | 'coming-soon' | 'no-source'

const STATUS_CONFIG: Record<StatusType, { label: string; bg: string; color: string }> = {
  'ready':        { label: 'Data Ready',      bg: '#10b98122', color: '#10b981' },
  'partial':      { label: 'Partial Data',    bg: '#f59e0b22', color: '#f59e0b' },
  'coming-soon':  { label: 'Coming Soon',     bg: '#3b82f622', color: '#3b82f6' },
  'no-source':    { label: 'Needs Data Source', bg: '#ef444422', color: '#ef4444' },
}

function StatusPill({ type }: { type: StatusType }) {
  const c = STATUS_CONFIG[type]
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, background: c.bg, color: c.color,
      letterSpacing: '0.03em',
    }}>
      {c.label}
    </span>
  )
}

// ─── Placeholder card ─────────────────────────────────────────────────────────

function PlaceholderCard({
  title, description, status, bullets,
}: {
  title: string
  description: string
  status: StatusType
  bullets: string[]
}) {
  return (
    <div style={{
      background: '#1a1a2a', border: '1px solid #2d2d44', borderRadius: 12,
      padding: '20px 22px', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>{title}</span>
        <StatusPill type={status} />
      </div>
      <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 12px', lineHeight: 1.6 }}>
        {description}
      </p>
      <ul style={{ margin: 0, padding: '0 0 0 18px', color: '#64748b', fontSize: 12, lineHeight: 1.8 }}>
        {bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    </div>
  )
}

// ─── KPI placeholder ──────────────────────────────────────────────────────────

function KpiPlaceholder({ label, status }: { label: string; status: StatusType }) {
  const c = STATUS_CONFIG[status]
  return (
    <div style={{
      background: '#1a1a2a', border: `1px dashed ${c.color}44`,
      borderRadius: 12, padding: '16px 18px', display: 'flex',
      flexDirection: 'column', gap: 6,
    }}>
      <span style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <div style={{
        height: 28, background: '#2d2d44', borderRadius: 6,
        width: '60%', animation: 'pulse 2s ease-in-out infinite',
      }} />
      <StatusPill type={status} />
    </div>
  )
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabBtn({
  active, onClick, accentColor, children,
}: {
  active: boolean; onClick: () => void; accentColor: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px', border: 'none', cursor: 'pointer',
        background: 'transparent', fontSize: 13, fontWeight: active ? 700 : 400,
        color: active ? accentColor : '#64748b',
        borderBottom: `2px solid ${active ? accentColor : 'transparent'}`,
        transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

// ─── Alan's Dashboard ─────────────────────────────────────────────────────────

function AlanDashboard() {
  const [tab, setTab] = useState<AlanTab>('overview')
  const accent = '#f59e0b'

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #2d2d44', marginBottom: 28, overflowX: 'auto' }}>
        <TabBtn active={tab === 'overview'}       onClick={() => setTab('overview')}       accentColor={accent}>📊 Overview</TabBtn>
        <TabBtn active={tab === 'loyalty'}        onClick={() => setTab('loyalty')}        accentColor={accent}>🎯 Loyalty</TabBtn>
        <TabBtn active={tab === 'inventory-mix'}  onClick={() => setTab('inventory-mix')}  accentColor={accent}>📦 Inventory Mix</TabBtn>
        <TabBtn active={tab === 'whats-working'}  onClick={() => setTab('whats-working')}  accentColor={accent}>✅ What's Working</TabBtn>
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div>
          <p style={{ color: '#64748b', fontSize: 12, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            KPI Cards — Live from Square & Social
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
            <KpiPlaceholder label="Revenue (30 Days)"    status="ready" />
            <KpiPlaceholder label="Transactions"         status="ready" />
            <KpiPlaceholder label="Avg Order Value"      status="ready" />
            <KpiPlaceholder label="CHI Score"            status="coming-soon" />
            <KpiPlaceholder label="New Loyalty Members"  status="partial" />
          </div>

          <PlaceholderCard
            title="Daily Revenue — Last 30 Days"
            status="ready"
            description="Line chart from square_orders / square_payments. RPCs already exist — just need to wire the chart."
            bullets={[
              'Source: get_square_sales_by_date RPC',
              'Chart: Recharts LineChart or Plotly',
              'Filter: date range selector',
            ]}
          />
          <PlaceholderCard
            title="Top Loyalty Members This Month"
            status="partial"
            description="We have square_customers but Square Loyalty program data (tiers, points, visit counts, social handles) requires a separate Loyalty API sync. Need to confirm if Dead Wax is using Square Loyalty."
            bullets={[
              'Customer spend: available via square_order_line_items JOIN square_customers',
              'Loyalty tier / points: needs Square Loyalty API ingestion',
              'Social handles linked: not in Square data — would need manual collection',
            ]}
          />
          <PlaceholderCard
            title="Weekly Loyalty Enrollment Chart"
            status="partial"
            description="Can approximate from customer created_at timestamps — true enrollment count needs Loyalty API."
            bullets={[
              'Source: square_customers.created_at',
              'Grouped by week using date_trunc',
            ]}
          />
        </div>
      )}

      {/* Loyalty */}
      {tab === 'loyalty' && (
        <div>
          <PlaceholderCard
            title="Loyalty Program Overview"
            status="partial"
            description="The mock promised member tiers (Crate Diggers, Event Regulars, etc.), visit counts per member, and social handles linked. Here's where we stand."
            bullets={[
              '✅ Customer records available in square_customers',
              '✅ Customer spend calculable from order line items',
              '⚠️ Loyalty tiers, points, and enrollment dates → needs Square Loyalty API',
              '❌ Social handles linked to customers → not in Square, would need manual data entry',
              '⚠️ Visit frequency → calculable from order history (orders per customer)',
            ]}
          />
          <PlaceholderCard
            title="Top Spenders Table"
            status="ready"
            description="Fully buildable from existing data — customers ranked by total spend in a rolling 30-day window."
            bullets={[
              'Source: square_order_line_items JOIN square_customers JOIN square_orders',
              'Filter: last 30 days via square_orders.created_at',
              'Sort: total spend DESC',
            ]}
          />
          <PlaceholderCard
            title="Segment Tags (Crate Diggers, Event Regulars, etc.)"
            status="coming-soon"
            description="Can be defined as rule-based logic once we confirm what data is available. E.g., 8+ visits/month = Crate Digger."
            bullets={[
              'Rules engine applied at query time via CASE WHEN in RPC',
              'Segments stored in a new customer_segments view or table',
            ]}
          />
        </div>
      )}

      {/* Inventory Mix */}
      {tab === 'inventory-mix' && (
        <div>
          <PlaceholderCard
            title="Inventory Mix vs Target by Genre"
            status="partial"
            description="Actual inventory by genre is available via catalog enrichment. 'Target' percentages need to be defined — either hard-coded or stored in a config table."
            bullets={[
              '✅ Actual genre counts: catalog_with_sales + catalog_enrichment (discogs_genres)',
              '⚠️ Target allocations: need Alan/Brad to define percentages per genre',
              'Plan: store targets in a new outlaw_data.genre_targets table',
              'Chart: grouped bar (actual vs target) with over/under-index alerts',
            ]}
          />
          <PlaceholderCard
            title="Over/Under-Index Alerts"
            status="coming-soon"
            description="Once targets are defined, alerts auto-generate from the delta between actual and target."
            bullets={[
              'Alert threshold: ±10% vs target triggers a flag',
              'Severity: orange = approaching, red = exceeded',
            ]}
          />
        </div>
      )}

      {/* What's Working */}
      {tab === 'whats-working' && (
        <div>
          <PlaceholderCard
            title="30-Day Performance Summary — What's Working / Needs Attention"
            status="coming-soon"
            description="Rule-based alerts engine that surfaces wins and issues automatically from real KPIs. No AI required — just smart thresholds."
            bullets={[
              'Top-selling formats & genres this period vs prior period',
              'Social platform with highest engagement delta (IG vs FB vs TikTok)',
              'Inventory alerts: genres approaching deficit',
              'Loyalty: enrollment trending up or down week-over-week',
            ]}
          />
          <PlaceholderCard
            title="CHI Score"
            status="coming-soon"
            description="Custom composite score from the mock. We need to define the formula — suggested components below."
            bullets={[
              'Sales velocity (30-day revenue trend): 30%',
              'Social engagement rate (avg across platforms): 30%',
              'Inventory health (genres near target): 20%',
              'Loyalty enrollment momentum: 20%',
              'Score normalized 0–100, displayed as gauge chart',
            ]}
          />
        </div>
      )}
    </div>
  )
}

// ─── Brad's Dashboard ─────────────────────────────────────────────────────────

function BradDashboard() {
  const [tab, setTab] = useState<BradTab>('events')
  const accent = '#10b981'

  return (
    <div>
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #2d2d44', marginBottom: 28, overflowX: 'auto' }}>
        <TabBtn active={tab === 'events'}      onClick={() => setTab('events')}      accentColor={accent}>📅 Events</TabBtn>
        <TabBtn active={tab === 'inventory'}   onClick={() => setTab('inventory')}   accentColor={accent}>📦 Inventory</TabBtn>
        <TabBtn active={tab === 'set-builder'} onClick={() => setTab('set-builder')} accentColor={accent}>🎵 Set Builder</TabBtn>
        <TabBtn active={tab === 'alerts'}      onClick={() => setTab('alerts')}      accentColor={accent}>🚨 Alerts</TabBtn>
      </div>

      {tab === 'events' && (
        <div>
          <PlaceholderCard
            title="Upcoming Events — RSVP & Social Signal Tracker"
            status="no-source"
            description="The mock showed Heavy Metal Night, Jazz Night, etc. with RSVP counts and attendance estimators. We don't have an event data source yet."
            bullets={[
              '❌ No events table in current schema',
              '⚠️ Facebook Events RSVPs: our facebook_* tables may have event data — needs investigation',
              'Option A: Manual event entry form → stored in outlaw_data.events table',
              'Option B: Square Events API (if Dead Wax uses it)',
              'Option C: Facebook Events API integration',
              'Attendance estimator slider: fully buildable once we have RSVP counts',
            ]}
          />
          <PlaceholderCard
            title="Event Promo Tracker"
            status="coming-soon"
            description="Track which social posts are driving event interest — requires events table + ability to tag posts to events."
            bullets={[
              'Link instagram_media and facebook_posts to specific events via tags',
              'Show engagement curve for event-related posts over time',
            ]}
          />
        </div>
      )}

      {tab === 'inventory' && (
        <div>
          <PlaceholderCard
            title="Browse & Filter Catalog"
            status="ready"
            description="Already live on the /shop page. Can embed or link directly from here for Brad's workflow."
            bullets={[
              'Source: get_shop_items RPC with full filter suite',
              'Filters: format, condition, genre, decade, price range',
              'Consider: Brad-specific view with cost/margin columns if available in Square',
            ]}
          />
          <PlaceholderCard
            title="Inventory Mix vs Target Chart"
            status="partial"
            description="Same as Alan's view — actual genre breakdown is ready, targets need to be defined."
            bullets={[
              'Surplus items: over-indexed genres → candidates for promotion/bundling',
              'Deficit items: under-indexed → buying priority list',
              'Brad sets targets, Alan sees the resulting alerts',
            ]}
          />
          <PlaceholderCard
            title="Recommended Actions"
            status="coming-soon"
            description="Auto-generated buying/selling suggestions based on inventory mix, sales velocity, and upcoming events."
            bullets={[
              'High sell-through + low stock → restock alert',
              'Low sell-through + high stock → promotion candidate',
              'Event coming up + genre deficit → urgent restock',
            ]}
          />
        </div>
      )}

      {tab === 'set-builder' && (
        <div>
          <PlaceholderCard
            title="Build an Album Set → Send to Sam"
            status="coming-soon"
            description="Brad hand-picks albums from the catalog to form a thematic set, then sends it to Sam as a campaign brief."
            bullets={[
              'Needs new DB: outlaw_data.album_sets (id, name, created_by, created_at, status)',
              'Needs new DB: outlaw_data.album_set_items (set_id, catalog_object_id)',
              'Brad UI: search catalog → add to set → name the set → click Send to Sam',
              "Sam UI: see Brad's sets in her 'From Brad' tab with album art + track list",
              'Supabase Realtime or polling for live notification when Brad sends a set',
            ]}
          />
        </div>
      )}

      {tab === 'alerts' && (
        <div>
          <PlaceholderCard
            title="Inventory Alerts — Action Required"
            status="partial"
            description="Deficit alerts are calculable from current catalog data once genre targets are defined."
            bullets={[
              '✅ Low stock detection: catalog items with times_sold > stock threshold',
              '⚠️ Deficit vs target: needs genre_targets table',
              'Alert types: critical (red), warning (orange), info (blue)',
              'Actionable: each alert links to catalog filter for that genre/format',
            ]}
          />
        </div>
      )}
    </div>
  )
}

// ─── Sam's Dashboard ──────────────────────────────────────────────────────────

function SamDashboard() {
  const [tab, setTab] = useState<SamTab>('post-tracker')
  const accent = '#a855f7'

  return (
    <div>
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #2d2d44', marginBottom: 28, overflowX: 'auto' }}>
        <TabBtn active={tab === 'post-tracker'} onClick={() => setTab('post-tracker')} accentColor={accent}>📝 Post Tracker</TabBtn>
        <TabBtn active={tab === 'platforms'}    onClick={() => setTab('platforms')}    accentColor={accent}>📡 Platforms</TabBtn>
        <TabBtn active={tab === 'from-brad'}    onClick={() => setTab('from-brad')}    accentColor={accent}>🎵 From Brad</TabBtn>
      </div>

      {tab === 'post-tracker' && (
        <div>
          <PlaceholderCard
            title="7-Day Engagement View — Instagram & Facebook Posts"
            status="ready"
            description="We have instagram_media, instagram_media_insights, facebook_posts, and facebook_post_metrics in the DB. Post tracker is very buildable."
            bullets={[
              '✅ Instagram: media list + per-post likes, comments, saves',
              '✅ Facebook: posts list + impressions, engaged_users, likes, clicks',
              'Engagement decay curve: need time-series insight snapshots (check if facebook_post_metrics has multiple rows per post)',
              'Click any post → see 7-day breakdown chart',
            ]}
          />
          <PlaceholderCard
            title="Campaign Strings — Related Posts Building Momentum"
            status="coming-soon"
            description="Groups thematically related posts into a 'campaign.' Requires either manual tagging or a smart heuristic."
            bullets={[
              'Option A: Tag posts to a campaign manually (new campaign_tags table)',
              'Option B: Auto-group by hashtag or keyword match in caption',
              'Show: campaign name, total reach, best post, next planned post',
            ]}
          />
        </div>
      )}

      {tab === 'platforms' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
            <KpiPlaceholder label="Instagram Avg Likes/Post" status="ready" />
            <KpiPlaceholder label="Instagram Eng. Rate"      status="ready" />
            <KpiPlaceholder label="Facebook Avg Likes/Post"  status="ready" />
            <KpiPlaceholder label="Facebook Eng. Rate"       status="ready" />
            <KpiPlaceholder label="TikTok Avg Likes"         status="partial" />
            <KpiPlaceholder label="TikTok Followers"         status="partial" />
          </div>
          <PlaceholderCard
            title="Daily Likes by Platform — 30-Day Trend"
            status="ready"
            description="Multi-line chart showing Instagram, Facebook, and TikTok engagement over time."
            bullets={[
              '✅ Instagram: instagram_insights (daily metric snapshots)',
              '✅ Facebook: facebook_page_history + facebook_post_metrics',
              '⚠️ TikTok: tiktok_video_snapshots table exists, no data synced yet',
              'Chart: Recharts LineChart with 3 series, each platform color-coded',
            ]}
          />
          <PlaceholderCard
            title="Instagram Snapshot"
            status="ready"
            description="Follower count, media count, top posts, demographic breakdown — all available."
            bullets={[
              'Source: instagram_account_history, instagram_media, instagram_demographics',
              'Top content formats by engagement',
              'Age/gender demographic breakdown (bar chart)',
            ]}
          />
          <PlaceholderCard
            title="Facebook Snapshot"
            status="ready"
            description="Page followers, reach, impressions, top posts — all available in the DB."
            bullets={[
              'Source: facebook_page_history, facebook_insights, facebook_posts, facebook_post_metrics',
              'Engagement rate comparison to Instagram',
              'Best day/time to post (derived from existing post metrics)',
            ]}
          />
        </div>
      )}

      {tab === 'from-brad' && (
        <div>
          <PlaceholderCard
            title="Album Sets from Brad — Build Campaigns Around These"
            status="coming-soon"
            description="Blocked on the Set Builder feature in Brad's dashboard. Once that's built, Sam sees sets here with album art, tracklist, and a campaign brief form."
            bullets={[
              'Needs: outlaw_data.album_sets + album_set_items tables',
              'Sam sees: set name, albums with cover art, genres, prices',
              'Sam can: attach a campaign brief (theme, target date, platforms)',
              'Link to Post Tracker to tag future posts to the campaign',
            ]}
          />
        </div>
      )}
    </div>
  )
}

// ─── Role Selector ────────────────────────────────────────────────────────────

interface RoleCardProps {
  name: string
  role: string
  description: string
  accentColor: string
  onSelect: () => void
}

function RoleCard({ name, role, description, accentColor, onSelect }: RoleCardProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#1a1a2a',
        border: `1px solid ${hovered ? accentColor : '#2d2d44'}`,
        borderRadius: 16, padding: '28px 24px', width: 240, cursor: 'pointer',
        textAlign: 'center', transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 8px 32px ${accentColor}22` : 'none',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Accent bar top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accentColor }} />
      <div style={{ fontSize: 42, marginBottom: 12 }}>
        {name === 'Alan' ? '👔' : name === 'Brad' ? '📦' : '📱'}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: accentColor, marginBottom: 4 }}>{name}</div>
      <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>{role}</div>
      <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5, marginBottom: 20 }}>{description}</div>
      <button
        style={{
          width: '100%', padding: '9px 0', border: 'none', borderRadius: 8,
          background: accentColor, color: '#0f0f1a', fontWeight: 700,
          fontSize: 13, cursor: 'pointer',
        }}
      >
        Open My Dashboard
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ManagementDashboardClient({ userEmail }: { userEmail: string }) {
  const [role, setRole] = useState<Role | null>(null)
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14 }}>

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px',
        background: '#1a1a2a', borderBottom: '1px solid #2d2d44',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <button
          onClick={() => role ? setRole(null) : router.push('/chi')}
          style={{
            background: 'transparent', border: '1px solid #3d3d54', color: '#94a3b8',
            padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
          }}
        >
          ← {role ? 'Switch Role' : 'Back to CHI'}
        </button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Dead Wax Records</span>
        {role && (
          <span style={{
            padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: role === 'alan' ? '#f59e0b22' : role === 'brad' ? '#10b98122' : '#a855f722',
            color: role === 'alan' ? '#f59e0b' : role === 'brad' ? '#10b981' : '#a855f7',
          }}>
            {role === 'alan' ? 'Alan — Owner' : role === 'brad' ? 'Brad — Operations' : 'Sam — Social Media'}
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 11 }}>
          Strategy & Operations Dashboard · Phase 1 Scaffold
        </span>
      </header>

      <main style={{ padding: '0 24px 48px' }}>

        {/* Role Selector */}
        {!role && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 'calc(100vh - 60px)', padding: '40px 0',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '0.04em', color: '#f59e0b', marginBottom: 8 }}>
                DEAD WAX RECORDS
              </div>
              <div style={{ color: '#64748b', fontSize: 13 }}>
                Strategy &amp; Operations Dashboard · Powered by Outlaw Apps
              </div>
            </div>

            <div style={{ color: '#94a3b8', marginBottom: 28, fontSize: 14 }}>
              Who are you? Select your dashboard to get started.
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 860 }}>
              <RoleCard
                name="Alan"
                role="Owner & Founder"
                description="Big-picture view: revenue, loyalty, what's working, what needs attention."
                accentColor="#f59e0b"
                onSelect={() => setRole('alan')}
              />
              <RoleCard
                name="Brad"
                role="Operations, Events & Inventory"
                description="Events, inventory health, set builder, surplus/deficit alerts."
                accentColor="#10b981"
                onSelect={() => setRole('brad')}
              />
              <RoleCard
                name="Sam"
                role="Social Media Manager"
                description="Post tracker, campaigns, platform analytics, album sets from Brad."
                accentColor="#a855f7"
                onSelect={() => setRole('sam')}
              />
            </div>

            <div style={{ marginTop: 48, color: '#2d2d44', fontSize: 11 }}>
              Dead Wax Records · Dallas, TX · Lakewood &amp; Deep Ellum · Outlaw Apps v1
            </div>
          </div>
        )}

        {/* Role Dashboards */}
        {role === 'alan' && (
          <div style={{ maxWidth: 1100, margin: '32px auto 0' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b', marginBottom: 6 }}>Alan's Dashboard</h2>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 28 }}>
              Owner & Founder · Revenue, loyalty, inventory strategy, and performance signals
            </p>
            <AlanDashboard />
          </div>
        )}

        {role === 'brad' && (
          <div style={{ maxWidth: 1100, margin: '32px auto 0' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#10b981', marginBottom: 6 }}>Brad's Dashboard</h2>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 28 }}>
              Operations, Events & Inventory · Events, catalog management, set builder, alerts
            </p>
            <BradDashboard />
          </div>
        )}

        {role === 'sam' && (
          <div style={{ maxWidth: 1100, margin: '32px auto 0' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#a855f7', marginBottom: 6 }}>Sam's Dashboard</h2>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 28 }}>
              Social Media Manager · Post tracker, platform analytics, campaigns, album sets
            </p>
            <SamDashboard />
          </div>
        )}

      </main>
    </div>
  )
}
