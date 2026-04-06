'use client'
/**
 * Extended Play Analysis Panel
 * Johnny Outlaw, LLC — Designed in Rockwall, TX
 *
 * Shows how long each post "keeps spinning" after publish.
 * Blue zone (days 1-2)  = New Reach  (initial audience burst)
 * Red  zone (days 3+)   = Extended Play (sustained tail engagement)
 *
 * A great post has a tall blue spike AND a long red tail.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CurvePoint {
  day: number
  cumulative: number
  delta: number
  sync_date: string
}

export interface ExtendedPlayPost {
  post_id: string
  platform: 'Instagram' | 'Facebook' | 'TikTok' | string
  caption: string | null
  media_type: string | null
  posted_at: string
  total_engagement: number
  peak_delta: number
  first_day_num: number
  badge: 'Viral' | 'Quick Spin' | 'B-Side' | 'Extended Play' | string
  curve: CurvePoint[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: '#e1306c',
  Facebook:  '#1877f2',
  TikTok:    '#69c9d0',
}

const BADGE_CONFIG: Record<string, { icon: string; bg: string; color: string }> = {
  'Viral':         { icon: '🔥', bg: '#ff6b3522', color: '#ff6b35' },
  'Quick Spin':    { icon: '⚡', bg: '#fbbf2422', color: '#fbbf24' },
  'Extended Play': { icon: '🎵', bg: '#61afef22', color: '#61afef' },
  'B-Side':        { icon: '📀', bg: '#55555522', color: '#888' },
}

// ─── Mini sparkline ───────────────────────────────────────────────────────────

function Sparkline({ curve }: { curve: CurvePoint[] }) {
  const W = 220, H = 52, PAD = 4

  if (!curve || curve.length === 0) {
    return <svg width={W} height={H}><line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="#222" strokeWidth={1} /></svg>
  }

  const maxDelta = Math.max(...curve.map(p => p.delta), 1)

  // Spread points evenly across width
  const pts = curve.map((p, i) => ({
    x: PAD + (i / Math.max(curve.length - 1, 1)) * (W - PAD * 2),
    y: H - PAD - (p.delta / maxDelta) * (H - PAD * 2),
    isNewReach: p.day <= 2,
    delta: p.delta,
    day: p.day,
  }))

  // Build path segments colored by zone
  const segments: { x1: number; y1: number; x2: number; y2: number; color: string }[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1]
    // Color the segment by the starting point's zone
    segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, color: a.isNewReach ? '#4b9cf5' : '#ff6b35' })
  }

  // Area fills
  const bluePoints = pts.filter(p => p.isNewReach)
  const redPoints  = pts.filter(p => !p.isNewReach)

  function areaPath(pts2: typeof pts, color: string) {
    if (pts2.length < 2) return null
    const d = pts2.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') +
      ` L ${pts2[pts2.length - 1].x},${H - PAD} L ${pts2[0].x},${H - PAD} Z`
    return <path d={d} fill={color} opacity={0.15} />
  }

  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="blue-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4b9cf5" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#4b9cf5" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="red-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff6b35" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#ff6b35" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Baseline */}
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#1e1e1e" strokeWidth={1} />

      {/* Area fills */}
      {areaPath(bluePoints, 'url(#blue-grad)')}
      {areaPath(redPoints, 'url(#red-grad)')}

      {/* Segment lines */}
      {segments.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.color} strokeWidth={1.8} strokeLinecap="round" />
      ))}

      {/* Dots */}
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y} r={2.5}
          fill={p.isNewReach ? '#4b9cf5' : '#ff6b35'}
          stroke="#0d0d0d" strokeWidth={1}
        />
      ))}
    </svg>
  )
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: ExtendedPlayPost }) {
  const platColor = PLATFORM_COLORS[post.platform] ?? '#888'
  const badge = BADGE_CONFIG[post.badge] ?? BADGE_CONFIG['B-Side']
  const postedDate = new Date(post.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const caption = (post.caption ?? '').replace(/\n/g, ' ')

  return (
    <div style={{
      background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 8,
      padding: '12px', display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#333')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
    >
      {/* Top row: platform + badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: platColor, letterSpacing: '0.03em' }}>
          {post.platform}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
          background: badge.bg, color: badge.color, letterSpacing: '0.04em',
        }}>
          {badge.icon} {post.badge}
        </span>
      </div>

      {/* Caption */}
      <p style={{ fontSize: 12, color: '#bbb', lineHeight: 1.4, margin: 0, minHeight: 32 }}>
        {caption.length > 68 ? caption.slice(0, 68) + '…' : caption || <span style={{ color: '#444' }}>No caption</span>}
      </p>

      {/* Sparkline */}
      <div style={{ background: '#080808', borderRadius: 4, overflow: 'hidden', border: '1px solid #111' }}>
        <Sparkline curve={post.curve} />
      </div>

      {/* Bottom row: likes + date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#e06c75', display: 'flex', alignItems: 'center', gap: 4 }}>
          ♥ {post.total_engagement.toLocaleString()}
        </span>
        <span style={{ fontSize: 11, color: '#444' }}>{postedDate}</span>
      </div>
    </div>
  )
}

// ─── Platform filter bar ──────────────────────────────────────────────────────

const PLATFORMS = ['All', 'Instagram', 'Facebook', 'TikTok']
const BADGES    = ['All', 'Viral', 'Quick Spin', 'Extended Play', 'B-Side']

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function ExtendedPlayPanel() {
  const supabase = createClient()
  const [posts, setPosts] = useState<ExtendedPlayPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterPlatform, setFilterPlatform] = useState('All')
  const [filterBadge, setFilterBadge] = useState('All')

  useEffect(() => {
    supabase.rpc('get_extended_play_posts').then(({ data, error: err }) => {
      if (err) { setError(err.message); setLoading(false); return }
      setPosts(data ?? [])
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = posts.filter(p =>
    (filterPlatform === 'All' || p.platform === filterPlatform) &&
    (filterBadge    === 'All' || p.badge    === filterBadge)
  )

  // Summary stats
  const viralCount  = posts.filter(p => p.badge === 'Viral').length
  const qsCount     = posts.filter(p => p.badge === 'Quick Spin').length
  const epCount     = posts.filter(p => p.badge === 'Extended Play').length
  const bsCount     = posts.filter(p => p.badge === 'B-Side').length
  const totalEng    = posts.reduce((s, p) => s + p.total_engagement, 0)

  function FilterChip({ label, value, active, onClick }: {
    label: string; value: string; active: boolean; onClick: () => void
  }) {
    return (
      <button
        onClick={onClick}
        style={{
          padding: '4px 12px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400,
          background: active ? '#ff6b35' : '#1a1a1a', color: active ? '#fff' : '#888',
          transition: 'all 0.15s',
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header + legend */}
      <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e0e0e0', letterSpacing: '0.03em' }}>
              🎵 Extended Play Analysis — How Long Do Your Posts Spin?
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#666', lineHeight: 1.5 }}>
              <span style={{ color: '#4b9cf5', fontWeight: 600 }}>Blue</span> = New Reach (days 1–2, initial audience burst).{' '}
              <span style={{ color: '#ff6b35', fontWeight: 600 }}>Red</span> = Extended Play (days 3+, sustained tail).
              <br />A great post has both — a tall blue spike AND a long red tail. Which formats create the longest groove?
            </p>
          </div>
          {/* Legend chips */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <span style={{ width: 10, height: 3, background: '#4b9cf5', borderRadius: 2, display: 'inline-block' }} />
              <span style={{ color: '#4b9cf5' }}>New Reach</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <span style={{ width: 10, height: 3, background: '#ff6b35', borderRadius: 2, display: 'inline-block' }} />
              <span style={{ color: '#ff6b35' }}>Extended Play (Days 3+)</span>
            </span>
            <span style={{ fontSize: 10, color: '#444' }}>X-axis = days since posting · dots = daily snapshot</span>
          </div>
        </div>

        {/* Summary row */}
        {!loading && posts.length > 0 && (
          <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 14, borderTop: '1px solid #1a1a1a', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Posts', value: posts.length, color: '#aaa' },
              { label: '🔥 Viral',      value: viralCount,  color: '#ff6b35' },
              { label: '⚡ Quick Spin', value: qsCount,     color: '#fbbf24' },
              { label: '🎵 Extended',   value: epCount,     color: '#61afef' },
              { label: '📀 B-Side',     value: bsCount,     color: '#666' },
              { label: 'Total Engagement', value: totalEng.toLocaleString(), color: '#e06c75' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#555', marginRight: 4 }}>Platform</span>
          {PLATFORMS.map(p => (
            <FilterChip key={p} label={p} value={p} active={filterPlatform === p} onClick={() => setFilterPlatform(p)} />
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: '#222' }} />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#555', marginRight: 4 }}>Badge</span>
          {BADGES.map(b => (
            <FilterChip key={b} label={b} value={b} active={filterBadge === b} onClick={() => setFilterBadge(b)} />
          ))}
        </div>
        {(filterPlatform !== 'All' || filterBadge !== 'All') && (
          <button
            onClick={() => { setFilterPlatform('All'); setFilterBadge('All') }}
            style={{ fontSize: 11, color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
          >
            ✕ Clear
          </button>
        )}
        <span style={{ fontSize: 11, color: '#444', marginLeft: 'auto' }}>
          {filtered.length} post{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#555' }}>Loading engagement curves…</div>
      ) : error ? (
        <div style={{ padding: 16, background: '#1a0808', border: '1px solid #3a1010', borderRadius: 6, color: '#e06c75', fontSize: 13 }}>
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#444', fontSize: 13 }}>
          No posts match your filters.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
        }}>
          {filtered.map(post => (
            <PostCard key={`${post.platform}-${post.post_id}`} post={post} />
          ))}
        </div>
      )}

      {/* Empty TikTok note */}
      {filterPlatform === 'TikTok' && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#444', fontSize: 13, marginTop: -24 }}>
          TikTok video data hasn&apos;t synced yet — tables are ready, waiting on the first import.
        </div>
      )}
    </div>
  )
}
