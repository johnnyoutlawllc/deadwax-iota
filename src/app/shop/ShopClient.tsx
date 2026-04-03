// Dead Wax Records — Shop Client (Catalog Explorer)
// Johnny Outlaw, LLC — Designed in Rockwall, TX
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ────────────────────────────────────────────────────────────────
const ORANGE = '#ff6b35'
const BG     = '#0a0a0a'
const CARD   = '#141414'
const CARD2  = '#111111'
const BORDER = '#222222'
const TEXT   = '#ffffff'
const MUTED  = '#777777'
const PAGE_SIZE = 60

const CHART_COLORS = [
  '#ff6b35', '#7c3aed', '#0ea5e9', '#059669', '#d97706',
  '#ef4444', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ec4899', '#6366f1', '#14b8a6', '#22c55e', '#eab308',
  '#f43f5e', '#a855f7', '#0891b2', '#16a34a', '#ca8a04',
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChartBar { label: string; count: number; decade?: number; tier?: string; sort_key?: number }
interface Summary {
  total_items: number
  by_format: ChartBar[]
  by_price_range: ChartBar[]
  by_genre: ChartBar[]
  by_decade: ChartBar[]
  by_year: ChartBar[]
  by_popularity: ChartBar[]
}

interface ShopItem {
  catalog_object_id: string
  name:              string
  artist_name:       string | null
  album_title:       string | null
  format:            string | null
  condition:         string | null
  item_type:         string | null
  performance_tier:  string | null
  times_sold:        number
  avg_price:         number
  thumbnail_url:     string | null
  genre:             string | null
  release_year:      string | null
  record_label:      string | null
  release_type:      string | null
  total_count:       number
  discogs_price:     string | null
  discogs_rating:    string | null
  discogs_have:      string | null
  discogs_want:      string | null
  styles:            string | null
  lastfm_genres:     string | null
  cover_url:         string | null
}

interface CartItem extends ShopItem { quantity: number }

type FilterDimension = 'format' | 'genre' | 'decade' | 'popularity' | 'year' | 'price_range'

interface ActiveFilter { dimension: FilterDimension; label: string; rpcParams: Record<string, string | number | null> }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function httpsUrl(url: string | null) {
  if (!url) return null
  return url.replace(/^http:\/\//, 'https://')
}

function fmtPrice(price: number | null) {
  if (!price || price === 0) return null
  return '$' + price.toFixed(2)
}

// ─── Bar Chart Component ──────────────────────────────────────────────────────
function BarChart({ title, data, activeLabel, onBarClick, color, icon }: {
  title: string
  data: ChartBar[]
  activeLabel: string | null
  onBarClick: (bar: ChartBar) => void
  color?: string
  icon?: string
}) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.count))

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        <span style={{ color: TEXT, fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</span>
        <span style={{ color: MUTED, fontSize: 11, marginLeft: 'auto' }}>{data.length} categories</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {data.map((bar, i) => {
          const pct = max > 0 ? (bar.count / max) * 100 : 0
          const isActive = activeLabel === bar.label
          const barColor = color || CHART_COLORS[i % CHART_COLORS.length]
          return (
            <button
              key={bar.label}
              onClick={() => onBarClick(bar)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '5px 8px',
                background: isActive ? `${barColor}18` : 'transparent',
                border: isActive ? `1px solid ${barColor}44` : '1px solid transparent',
                borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#1a1a1a' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ color: isActive ? barColor : '#aaa', fontSize: 12, minWidth: 90, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isActive ? 700 : 400 }}>
                {bar.label}
              </span>
              <div style={{ flex: 1, height: 14, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  height: '100%', borderRadius: 3, transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
                  width: `${pct}%`,
                  background: isActive
                    ? `linear-gradient(90deg, ${barColor}, ${barColor}cc)`
                    : `linear-gradient(90deg, ${barColor}88, ${barColor}44)`,
                }} />
              </div>
              <span style={{ color: isActive ? TEXT : MUTED, fontSize: 11, fontWeight: 600, minWidth: 44, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {bar.count.toLocaleString()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Vinyl Placeholder ────────────────────────────────────────────────────────
function VinylPlaceholder({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <circle cx="24" cy="24" r="23" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1"/>
      {[18,13,9].map(r => <circle key={r} cx="24" cy="24" r={r} fill="none" stroke="#252525" strokeWidth="0.8"/>)}
      <circle cx="24" cy="24" r="4" fill="#111"/>
      <circle cx="24" cy="24" r="2" fill={ORANGE} opacity="0.7"/>
    </svg>
  )
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.3
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <span style={{ color: '#f59e0b', fontSize: 11, lineHeight: 1 }}>
      {'★'.repeat(full)}{half ? '½' : ''}<span style={{ color: '#333' }}>{'★'.repeat(empty)}</span>
    </span>
  )
}

// ─── Side Panel Item Row ──────────────────────────────────────────────────────
function PanelItem({ item, onClick, inCart }: { item: ShopItem; onClick: () => void; inCart: boolean }) {
  const art = httpsUrl(item.cover_url) || httpsUrl(item.thumbnail_url)
  const title = item.album_title || item.name
  const price = fmtPrice(item.avg_price)
  const discogsPrice = item.discogs_price ? parseFloat(item.discogs_price) : 0
  const rating = item.discogs_rating ? parseFloat(item.discogs_rating) : 0

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', gap: 12, padding: '10px 14px', background: 'transparent',
        border: 'none', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
        textAlign: 'left', width: '100%', transition: 'background 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Thumbnail */}
      <div style={{ width: 56, height: 56, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#111' }}>
        {art ? (
          <img src={art} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <VinylPlaceholder size={40} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {item.artist_name && (
          <div style={{ color: ORANGE, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.artist_name}
          </div>
        )}
        <div style={{ color: TEXT, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
          {rating > 0 && <StarRating rating={rating} />}
          {item.format && (
            <span style={{ color: '#555', fontSize: 10 }}>{item.format}</span>
          )}
        </div>
      </div>

      {/* Price col */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
        {price ? (
          <span style={{ color: TEXT, fontSize: 14, fontWeight: 800 }}>{price}</span>
        ) : (
          <span style={{ color: '#444', fontSize: 11 }}>—</span>
        )}
        {discogsPrice > 0 && (
          <span style={{ color: '#059669', fontSize: 10, fontWeight: 600 }}>Discogs ${discogsPrice.toFixed(2)}</span>
        )}
        {inCart && (
          <span style={{ color: ORANGE, fontSize: 9, fontWeight: 700 }}>IN CART</span>
        )}
      </div>
    </button>
  )
}

// ─── Item Detail Modal ────────────────────────────────────────────────────────
function ItemModal({ item, onClose, onAdd, inCart }: {
  item: ShopItem; onClose: () => void; onAdd: (i: ShopItem) => void; inCart: boolean
}) {
  const art = httpsUrl(item.cover_url) || httpsUrl(item.thumbnail_url)
  const title = item.album_title || item.name
  const price = fmtPrice(item.avg_price)
  const discogsPrice = item.discogs_price ? parseFloat(item.discogs_price) : 0
  const rating = item.discogs_rating ? parseFloat(item.discogs_rating) : 0
  const haveCount = item.discogs_have ? parseInt(item.discogs_have) : 0
  const wantCount = item.discogs_want ? parseInt(item.discogs_want) : 0

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 560, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto',
        background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18,
        zIndex: 301, animation: 'popIn 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: MUTED, fontSize: 24, cursor: 'pointer', zIndex: 2, lineHeight: 1 }}>×</button>

        {/* Art */}
        <div style={{ width: '100%', aspectRatio: '1/1', maxHeight: 340, overflow: 'hidden', background: '#0f0f0f', position: 'relative' }}>
          {art ? (
            <img src={art} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VinylPlaceholder size={120} />
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,20,20,1) 0%, transparent 50%)' }} />

          {/* HOT */}
          {item.performance_tier === 'Hot' && (
            <div style={{ position: 'absolute', top: 14, left: 16, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.1em' }}>HOT</div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '0 28px 28px', marginTop: -40, position: 'relative', zIndex: 1 }}>
          {/* Artist */}
          {item.artist_name && (
            <div style={{ color: ORANGE, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              {item.artist_name}
            </div>
          )}

          {/* Title */}
          <h2 style={{ color: TEXT, fontSize: 22, fontWeight: 800, lineHeight: 1.2, margin: '0 0 10px' }}>{title}</h2>

          {/* Rating */}
          {rating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <StarRating rating={rating} />
              <span style={{ color: MUTED, fontSize: 12 }}>{rating.toFixed(1)} / 5</span>
              {(haveCount > 0 || wantCount > 0) && (
                <span style={{ color: '#444', fontSize: 11, marginLeft: 6 }}>
                  {haveCount > 0 && `${haveCount.toLocaleString()} have`}
                  {haveCount > 0 && wantCount > 0 && ' · '}
                  {wantCount > 0 && <span style={{ color: '#f59e0b99' }}>{wantCount.toLocaleString()} want</span>}
                </span>
              )}
            </div>
          )}

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', marginBottom: 16 }}>
            {item.format && <MetaRow label="Format" value={item.format} />}
            {item.condition && <MetaRow label="Condition" value={item.condition} />}
            {item.release_year && <MetaRow label="Year" value={String(item.release_year)} />}
            {item.record_label && <MetaRow label="Label" value={item.record_label} />}
            {item.release_type && <MetaRow label="Type" value={item.release_type} />}
            {item.genre && <MetaRow label="Genre" value={item.genre} />}
            {item.times_sold > 0 && <MetaRow label="Times Sold" value={`${item.times_sold}×`} />}
            {item.item_type && <MetaRow label="Category" value={item.item_type} />}
          </div>

          {/* Styles / Tags */}
          {item.styles && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
              {item.styles.split(', ').map(s => (
                <span key={s} style={{ background: '#1a1a2e', color: '#7c8aff', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 4 }}>{s}</span>
              ))}
            </div>
          )}
          {item.lastfm_genres && !item.styles && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
              {item.lastfm_genres.split(', ').slice(0, 6).map(g => (
                <span key={g} style={{ background: '#1a0d0d', color: '#d94343', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 4 }}>{g}</span>
              ))}
            </div>
          )}

          {/* Price + CTA */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginTop: 8, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
            <div>
              <div style={{ color: TEXT, fontSize: 28, fontWeight: 900 }}>
                {price ?? <span style={{ color: '#555', fontSize: 16, fontWeight: 400 }}>Price varies</span>}
              </div>
              {discogsPrice > 0 && (
                <div style={{ color: '#059669', fontSize: 12, fontWeight: 600, marginTop: 2 }}>Discogs marketplace from ${discogsPrice.toFixed(2)}</div>
              )}
            </div>
            <button
              onClick={() => onAdd(item)}
              style={{
                background: inCart ? 'transparent' : ORANGE,
                color: inCart ? ORANGE : '#fff',
                border: inCart ? `2px solid ${ORANGE}` : 'none',
                borderRadius: 10, padding: '14px 32px', fontSize: 15, fontWeight: 800,
                cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
              }}
              onMouseEnter={e => { if (!inCart) e.currentTarget.style.background = '#e05a28' }}
              onMouseLeave={e => { if (!inCart) e.currentTarget.style.background = inCart ? 'transparent' : ORANGE }}
            >
              {inCart ? '✓ In Cart' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: MUTED, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ color: '#ccc', fontSize: 13, fontWeight: 500, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer({ cart, onClose, onRemove, onQty }: {
  cart: CartItem[]; onClose: () => void; onRemove: (id: string) => void; onQty: (id: string, q: number) => void
}) {
  const subtotal   = cart.reduce((s, c) => s + (c.avg_price || 0) * c.quantity, 0)
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0)
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 400, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, background: CARD2, borderLeft: `1px solid ${BORDER}`, zIndex: 401, display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.24s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ color: TEXT, fontSize: 17, fontWeight: 700 }}>Your Cart</span>
            {totalItems > 0 && <span style={{ color: MUTED, fontSize: 12 }}>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 22px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: MUTED, paddingTop: 60 }}>
              <VinylPlaceholder size={56} />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#555', marginTop: 16 }}>Nothing here yet</div>
            </div>
          ) : cart.map(item => {
            const img = httpsUrl(item.cover_url) || httpsUrl(item.thumbnail_url)
            return (
              <div key={item.catalog_object_id} style={{ display: 'flex', gap: 12, paddingBottom: 14, marginBottom: 14, borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ width: 50, height: 50, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#1a1a1a' }}>
                  {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <VinylPlaceholder size={50} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {item.artist_name && <div style={{ color: ORANGE, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{item.artist_name}</div>}
                  <div style={{ color: TEXT, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.album_title || item.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => onQty(item.catalog_object_id, item.quantity - 1)} style={{ width: 24, height: 24, background: '#222', border: `1px solid ${BORDER}`, borderRadius: 4, color: TEXT, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ color: TEXT, fontSize: 12, minWidth: 14, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => onQty(item.catalog_object_id, item.quantity + 1)} style={{ width: 24, height: 24, background: '#222', border: `1px solid ${BORDER}`, borderRadius: 4, color: TEXT, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>{item.avg_price > 0 ? fmtPrice(item.avg_price * item.quantity) : '—'}</span>
                      <button onClick={() => onRemove(item.catalog_object_id)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {cart.length > 0 && (
          <div style={{ padding: '16px 22px 22px', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: MUTED, fontSize: 13 }}>Subtotal</span>
              <span style={{ color: TEXT, fontSize: 18, fontWeight: 800 }}>{fmtPrice(subtotal) ?? '—'}</span>
            </div>
            <div style={{ background: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: ORANGE, fontSize: 13 }}>⚡</span>
              <span style={{ color: MUTED, fontSize: 11 }}>Demo mode — payment coming soon</span>
            </div>
            <button style={{ width: '100%', background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, padding: '14px 0', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              Request Purchase
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ShopClient() {
  const supabase = createClient()

  // Summary data
  const [summary, setSummary] = useState<Summary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  // Filter & side panel
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null)
  const [panelItems, setPanelItems] = useState<ShopItem[]>([])
  const [panelCount, setPanelCount] = useState(0)
  const [panelLoading, setPanelLoading] = useState(false)
  const [panelPage, setPanelPage] = useState(1)

  // Detail modal
  const [detailItem, setDetailItem] = useState<ShopItem | null>(null)

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const cartQty = cart.reduce((s, c) => s + c.quantity, 0)
  const cartIds = new Set(cart.map(c => c.catalog_object_id))

  // Search
  const [search, setSearch] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // ── Load summary ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setSummaryLoading(true)
      const { data } = await supabase.rpc('get_shop_summary')
      if (data) setSummary(data as Summary)
      setSummaryLoading(false)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Load panel items when filter changes ────────────────────────────────────
  const loadPanel = useCallback(async (filter: ActiveFilter, page: number) => {
    setPanelLoading(true)
    const { data } = await supabase.rpc('get_shop_items', {
      p_search: null,
      p_format: filter.rpcParams.p_format ?? null,
      p_condition: null,
      p_genre: filter.rpcParams.p_genre ?? null,
      p_decade: filter.rpcParams.p_decade ?? null,
      p_item_type: null,
      p_performance: filter.rpcParams.p_performance ?? null,
      p_sort: 'popular',
      p_page: page,
      p_page_size: PAGE_SIZE,
    })
    setPanelLoading(false)
    if (data && data.length > 0) {
      setPanelItems(prev => page === 1 ? data as ShopItem[] : [...prev, ...data as ShopItem[]])
      setPanelCount(Number((data as ShopItem[])[0].total_count))
    } else if (page === 1) {
      setPanelItems([])
      setPanelCount(0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeFilter) {
      setPanelPage(1)
      setPanelItems([])
      loadPanel(activeFilter, 1)
    }
  }, [activeFilter, loadPanel])

  // ── Search handler ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!search) return
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      setPanelLoading(true)
      setActiveFilter(null)
      const { data } = await supabase.rpc('get_shop_items', {
        p_search: search, p_format: null, p_condition: null, p_genre: null,
        p_decade: null, p_item_type: null, p_performance: null,
        p_sort: 'popular', p_page: 1, p_page_size: PAGE_SIZE,
      })
      setPanelLoading(false)
      if (data && data.length > 0) {
        setPanelItems(data as ShopItem[])
        setPanelCount(Number((data as ShopItem[])[0].total_count))
      } else {
        setPanelItems([])
        setPanelCount(0)
      }
    }, 400)
    return () => clearTimeout(searchTimer.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // ── Bar click handlers ──────────────────────────────────────────────────────
  const handleBarClick = (dimension: FilterDimension, bar: ChartBar) => {
    // Toggle off if same bar clicked
    if (activeFilter?.dimension === dimension && activeFilter?.label === bar.label) {
      setActiveFilter(null)
      setPanelItems([])
      setPanelCount(0)
      setSearch('')
      return
    }
    setSearch('')
    let rpcParams: Record<string, string | number | null> = {}
    switch (dimension) {
      case 'format':     rpcParams = { p_format: bar.label }; break
      case 'genre':      rpcParams = { p_genre: bar.label }; break
      case 'decade':     rpcParams = { p_decade: bar.decade ?? 0 }; break
      case 'year':       rpcParams = { p_decade: 0, p_genre: '', p_format: '', p_performance: '' }; break // we'll search by year
      case 'popularity': rpcParams = { p_performance: bar.tier ?? '' }; break
      case 'price_range': rpcParams = {}; break // price filter not in RPC yet, use search
    }
    // For year, we use decade approximation + search won't work. Use decade filter for the year's decade
    if (dimension === 'year' && bar.label) {
      const yr = parseInt(bar.label)
      rpcParams = { p_decade: Math.floor(yr / 10) * 10 }
    }
    setActiveFilter({ dimension, label: bar.label, rpcParams })
  }

  // ── Cart helpers ────────────────────────────────────────────────────────────
  const addToCart = (item: ShopItem) => {
    setCart(prev => prev.some(c => c.catalog_object_id === item.catalog_object_id)
      ? prev : [...prev, { ...item, quantity: 1 }])
  }
  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.catalog_object_id !== id))
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return }
    setCart(prev => prev.map(c => c.catalog_object_id === id ? { ...c, quantity: qty } : c))
  }

  const loadMore = () => {
    if (!activeFilter) return
    const next = panelPage + 1
    setPanelPage(next)
    loadPanel(activeFilter, next)
  }

  const panelOpen = panelItems.length > 0 || panelLoading || !!search

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes popIn { from { transform: translate(-50%, -50%) scale(0.92); opacity: 0 } to { transform: translate(-50%, -50%) scale(1); opacity: 1 } }
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
        input:focus { outline: none; border-color: ${ORANGE} !important; }
      `}</style>

      {/* ── Header ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,10,0.96)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1680, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 18, height: 60 }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 22 22" style={{ marginRight: 5 }}>
              <circle cx="11" cy="11" r="10.5" fill="none" stroke={ORANGE} strokeWidth="1.5"/>
              <circle cx="11" cy="11" r="7" fill="none" stroke={ORANGE} strokeWidth="1" opacity="0.5"/>
              <circle cx="11" cy="11" r="3" fill="none" stroke={ORANGE} strokeWidth="1" opacity="0.3"/>
              <circle cx="11" cy="11" r="1.5" fill={ORANGE}/>
            </svg>
            <span style={{ color: ORANGE, fontWeight: 800, fontSize: 17 }}>Dead Wax</span>
            <span style={{ color: TEXT, fontWeight: 300, fontSize: 17, marginLeft: 5 }}>Records</span>
          </a>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED, fontSize: 16, pointerEvents: 'none' }}>⌕</span>
            <input
              type="text" placeholder="Search artists, albums, titles..."
              value={search}
              onChange={e => { setSearch(e.target.value); if (!e.target.value) { setPanelItems([]); setPanelCount(0) } }}
              style={{ width: '100%', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '8px 36px 8px 36px', color: TEXT, fontSize: 13, transition: 'border-color 0.15s' }}
            />
            {search && <button onClick={() => { setSearch(''); setPanelItems([]); setPanelCount(0) }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>}
          </div>

          <div style={{ flex: 1 }} />

          {summary && !summaryLoading && (
            <span style={{ color: MUTED, fontSize: 12, flexShrink: 0 }}>
              {summary.total_items.toLocaleString()} titles in catalog
            </span>
          )}

          {/* Cart */}
          <button onClick={() => setCartOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: cartQty > 0 ? ORANGE : CARD, border: `1px solid ${cartQty > 0 ? ORANGE : BORDER}`, borderRadius: 10, padding: '7px 15px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Cart
            {cartQty > 0 && <span style={{ background: '#fff', color: ORANGE, fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartQty > 9 ? '9+' : cartQty}</span>}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1680, margin: '0 auto', display: 'flex', minHeight: 'calc(100vh - 60px)' }}>

        {/* ── Chart Explorer (Main Area) ── */}
        <main style={{ flex: 1, padding: '24px 24px 48px', minWidth: 0, transition: 'all 0.3s' }}>

          {/* Active filter pill */}
          {(activeFilter || search) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ color: MUTED, fontSize: 12 }}>Showing:</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${ORANGE}1a`, border: `1px solid ${ORANGE}44`, color: ORANGE, fontSize: 13, fontWeight: 700, padding: '5px 14px', borderRadius: 20 }}>
                {search ? `"${search}"` : activeFilter?.label}
                <button onClick={() => { setActiveFilter(null); setSearch(''); setPanelItems([]); setPanelCount(0) }} style={{ background: 'none', border: 'none', color: ORANGE, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
              </span>
              {panelCount > 0 && <span style={{ color: MUTED, fontSize: 12 }}>{panelCount.toLocaleString()} items</span>}
            </div>
          )}

          {summaryLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
              <div style={{ width: 44, height: 44, border: `3px solid ${BORDER}`, borderTopColor: ORANGE, borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
            </div>
          ) : summary && (
            <>
              {/* Hero stats */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Titles', value: summary.total_items.toLocaleString(), color: ORANGE },
                  { label: 'Formats', value: String(summary.by_format?.length ?? 0), color: '#7c3aed' },
                  { label: 'Genres', value: String(summary.by_genre?.length ?? 0), color: '#0ea5e9' },
                  { label: 'Decades', value: String(summary.by_decade?.length ?? 0), color: '#059669' },
                ].map(s => (
                  <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 20px', flex: '1 1 140px', minWidth: 140 }}>
                    <div style={{ color: MUTED, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                    <div style={{ color: s.color, fontSize: 26, fontWeight: 900, marginTop: 2 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Chart grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                <BarChart title="By Format" data={summary.by_format} icon="💿"
                  activeLabel={activeFilter?.dimension === 'format' ? activeFilter.label : null}
                  onBarClick={bar => handleBarClick('format', bar)} color="#7c3aed" />

                <BarChart title="By Genre" data={summary.by_genre} icon="🎵"
                  activeLabel={activeFilter?.dimension === 'genre' ? activeFilter.label : null}
                  onBarClick={bar => handleBarClick('genre', bar)} />

                <BarChart title="By Decade" data={summary.by_decade} icon="📅"
                  activeLabel={activeFilter?.dimension === 'decade' ? activeFilter.label : null}
                  onBarClick={bar => handleBarClick('decade', bar)} color="#059669" />

                <BarChart title="By Year" data={summary.by_year?.slice(0, 20)} icon="📆"
                  activeLabel={activeFilter?.dimension === 'year' ? activeFilter.label : null}
                  onBarClick={bar => handleBarClick('year', bar)} color="#0ea5e9" />

                <BarChart title="By Price Range" data={summary.by_price_range?.filter(b => b.label !== 'No Price')} icon="💰"
                  activeLabel={activeFilter?.dimension === 'price_range' ? activeFilter.label : null}
                  onBarClick={bar => handleBarClick('price_range', bar)} color="#d97706" />

                <BarChart title="By Popularity" data={summary.by_popularity} icon="🔥"
                  activeLabel={activeFilter?.dimension === 'popularity' ? activeFilter.label : null}
                  onBarClick={bar => handleBarClick('popularity', bar)} color="#ef4444" />
              </div>

              {/* Enrichment callout */}
              <div style={{ marginTop: 28, padding: '14px 18px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 22 22">
                    <circle cx="11" cy="11" r="10.5" fill="none" stroke={ORANGE} strokeWidth="1.5"/>
                    <circle cx="11" cy="11" r="7" fill="none" stroke={ORANGE} strokeWidth="1" opacity="0.4"/>
                    <circle cx="11" cy="11" r="1.5" fill={ORANGE}/>
                  </svg>
                </div>
                <div>
                  <div style={{ color: '#888', fontSize: 12, lineHeight: 1.5 }}>
                    Click any bar to explore matching items. Catalog enriched via{' '}
                    <span style={{ color: '#ba11ff', fontWeight: 600 }}>MusicBrainz</span>,{' '}
                    <span style={{ color: ORANGE, fontWeight: 600 }}>Discogs</span>,{' '}
                    <span style={{ color: '#d94343', fontWeight: 600 }}>Last.fm</span> &amp;{' '}
                    <span style={{ color: '#0ea5e9', fontWeight: 600 }}>CoverArtArchive</span>.
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        {/* ── Side Panel ── */}
        {panelOpen && (
          <aside style={{
            width: 400, flexShrink: 0, borderLeft: `1px solid ${BORDER}`,
            position: 'sticky', top: 60, maxHeight: 'calc(100vh - 60px)', overflowY: 'auto',
            background: CARD2, animation: 'slideInRight 0.2s ease-out',
          }}>
            {/* Panel header */}
            <div style={{ position: 'sticky', top: 0, zIndex: 2, background: CARD2, borderBottom: `1px solid ${BORDER}`, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: TEXT, fontSize: 14, fontWeight: 700 }}>
                  {search ? `Results for "${search}"` : activeFilter?.label ?? 'Items'}
                </div>
                <div style={{ color: MUTED, fontSize: 11 }}>{panelCount.toLocaleString()} items</div>
              </div>
              <button onClick={() => { setActiveFilter(null); setSearch(''); setPanelItems([]); setPanelCount(0) }} style={{ background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: 6, color: MUTED, cursor: 'pointer', padding: '4px 10px', fontSize: 12 }}>Close</button>
            </div>

            {/* Panel items */}
            {panelLoading && panelItems.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <div style={{ width: 32, height: 32, border: `3px solid ${BORDER}`, borderTopColor: ORANGE, borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
              </div>
            ) : (
              <>
                {panelItems.map(item => (
                  <PanelItem
                    key={item.catalog_object_id}
                    item={item}
                    onClick={() => setDetailItem(item)}
                    inCart={cartIds.has(item.catalog_object_id)}
                  />
                ))}
                {panelItems.length < panelCount && (
                  <div style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={loadMore}
                      disabled={panelLoading}
                      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, color: ORANGE, padding: '10px 24px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {panelLoading ? 'Loading...' : `Load More (${(panelCount - panelItems.length).toLocaleString()} remaining)`}
                    </button>
                  </div>
                )}
                {panelItems.length === 0 && !panelLoading && (
                  <div style={{ textAlign: 'center', color: MUTED, padding: '48px 20px' }}>
                    No items found
                  </div>
                )}
              </>
            )}
          </aside>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {detailItem && (
        <ItemModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onAdd={(item) => { addToCart(item); setDetailItem(null); setCartOpen(true) }}
          inCart={cartIds.has(detailItem.catalog_object_id)}
        />
      )}

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onRemove={removeFromCart} onQty={updateQty} />
      )}
    </div>
  )
}
