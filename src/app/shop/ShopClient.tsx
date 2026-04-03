// Dead Wax Records — Shop Client (Catalog Explorer v2)
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
const PAGE_SIZE = 48

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function httpsUrl(url: string | null) {
  if (!url) return null
  return url.replace(/^http:\/\//, 'https://')
}

function fmtPrice(price: number | null) {
  if (!price || price === 0) return null
  return '$' + price.toFixed(2)
}

// ─── Bar Chart (single accent color, horizontal) ─────────────────────────────
function BarChart({ title, data, activeLabel, onBarClick }: {
  title: string
  data: ChartBar[]
  activeLabel: string | null
  onBarClick: (bar: ChartBar) => void
}) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.count))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ color: MUTED, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2, padding: '0 2px' }}>
        {title}
      </div>
      {data.map(bar => {
        const pct = max > 0 ? (bar.count / max) * 100 : 0
        const isActive = activeLabel === bar.label
        return (
          <button
            key={bar.label}
            onClick={() => onBarClick(bar)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px',
              background: isActive ? `${ORANGE}18` : 'transparent',
              border: isActive ? `1px solid ${ORANGE}44` : '1px solid transparent',
              borderRadius: 5, cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#1a1a1a' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? `${ORANGE}18` : 'transparent' }}
          >
            <span style={{ color: isActive ? ORANGE : '#999', fontSize: 11, minWidth: 72, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isActive ? 700 : 400 }}>
              {bar.label}
            </span>
            <div style={{ flex: 1, height: 10, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2, transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
                width: `${pct}%`,
                background: isActive ? ORANGE : `${ORANGE}55`,
              }} />
            </div>
            <span style={{ color: isActive ? TEXT : '#555', fontSize: 10, fontWeight: 600, minWidth: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {bar.count.toLocaleString()}
            </span>
          </button>
        )
      })}
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

// ─── Format Badge ─────────────────────────────────────────────────────────────
const FORMAT_SHORT: Record<string, string> = { 'Vinyl / LP': 'LP', 'CD': 'CD', 'Cassette': 'Cass', '7" Single': '7"', '12" Single': '12"', 'Other': 'Misc' }

function FormatBadge({ format }: { format: string | null }) {
  if (!format) return null
  const label = FORMAT_SHORT[format] ?? format.substring(0, 4)
  return (
    <span style={{ background: `${ORANGE}22`, color: ORANGE, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {label}
    </span>
  )
}

// ─── Item Card (grid view) ────────────────────────────────────────────────────
function ItemCard({ item, onClick, inCart }: { item: ShopItem; onClick: () => void; inCart: boolean }) {
  const [imgErr, setImgErr] = useState(false)
  const art = httpsUrl(item.cover_url) || httpsUrl(item.thumbnail_url)
  const hasArt = !!art && !imgErr
  const title = item.album_title || item.name
  const price = fmtPrice(item.avg_price)
  const discogsPrice = item.discogs_price ? parseFloat(item.discogs_price) : 0
  const rating = item.discogs_rating ? parseFloat(item.discogs_rating) : 0

  return (
    <button
      onClick={onClick}
      style={{
        background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', cursor: 'pointer', textAlign: 'left',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'; e.currentTarget.style.borderColor = '#333' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = BORDER }}
    >
      {/* Art */}
      <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: '#0f0f0f' }}>
        {hasArt ? (
          <img src={art!} alt={title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setImgErr(true)} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <VinylPlaceholder size={64} />
          </div>
        )}
        {item.performance_tier === 'Hot' && (
          <div style={{ position: 'absolute', top: 7, right: 7, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 12, letterSpacing: '0.08em' }}>HOT</div>
        )}
        {inCart && (
          <div style={{ position: 'absolute', top: 7, left: 7, background: ORANGE, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 12 }}>IN CART</div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '10px 11px 12px', display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {item.artist_name && (
          <div style={{ color: ORANGE, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.artist_name}
          </div>
        )}
        <div style={{ color: TEXT, fontSize: 12, fontWeight: 600, lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {title}
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 1 }}>
          <FormatBadge format={item.format} />
          {rating > 0 && <StarRating rating={rating} />}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 }}>
          <div>
            <div style={{ color: TEXT, fontSize: 15, fontWeight: 800 }}>{price ?? <span style={{ color: '#444', fontSize: 11, fontWeight: 400 }}>--</span>}</div>
            {discogsPrice > 0 && <div style={{ color: '#059669', fontSize: 9, fontWeight: 600 }}>Discogs ${discogsPrice.toFixed(2)}</div>}
          </div>
          {item.release_year && <span style={{ color: '#444', fontSize: 10 }}>{item.release_year}</span>}
        </div>
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
        width: 540, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto',
        background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16,
        zIndex: 301, animation: 'popIn 0.22s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#999', fontSize: 20, cursor: 'pointer', zIndex: 2, lineHeight: 1, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>

        <div style={{ width: '100%', aspectRatio: '1/1', maxHeight: 320, overflow: 'hidden', background: '#0f0f0f', position: 'relative' }}>
          {art ? (
            <img src={art} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><VinylPlaceholder size={120} /></div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,20,20,1) 0%, transparent 50%)' }} />
          {item.performance_tier === 'Hot' && (
            <div style={{ position: 'absolute', top: 14, left: 16, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.1em' }}>HOT</div>
          )}
        </div>

        <div style={{ padding: '0 26px 26px', marginTop: -36, position: 'relative', zIndex: 1 }}>
          {item.artist_name && (
            <div style={{ color: ORANGE, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{item.artist_name}</div>
          )}
          <h2 style={{ color: TEXT, fontSize: 20, fontWeight: 800, lineHeight: 1.2, margin: '0 0 10px' }}>{title}</h2>

          {rating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <StarRating rating={rating} />
              <span style={{ color: MUTED, fontSize: 12 }}>{rating.toFixed(1)} / 5</span>
              {(haveCount > 0 || wantCount > 0) && (
                <span style={{ color: '#444', fontSize: 11, marginLeft: 4 }}>
                  {haveCount > 0 && `${haveCount.toLocaleString()} have`}
                  {haveCount > 0 && wantCount > 0 && ' / '}
                  {wantCount > 0 && `${wantCount.toLocaleString()} want`}
                </span>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', marginBottom: 14 }}>
            {item.format && <MetaRow label="Format" value={item.format} />}
            {item.condition && <MetaRow label="Condition" value={item.condition} />}
            {item.release_year && <MetaRow label="Year" value={String(item.release_year)} />}
            {item.record_label && <MetaRow label="Label" value={item.record_label} />}
            {item.release_type && <MetaRow label="Type" value={item.release_type} />}
            {item.genre && <MetaRow label="Genre" value={item.genre} />}
            {item.times_sold > 0 && <MetaRow label="Times Sold" value={`${item.times_sold}x`} />}
            {item.item_type && <MetaRow label="Category" value={item.item_type} />}
          </div>

          {item.styles && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
              {item.styles.split(', ').map(s => (
                <span key={s} style={{ background: '#1a1a2e', color: '#7c8aff', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4 }}>{s}</span>
              ))}
            </div>
          )}
          {item.lastfm_genres && !item.styles && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
              {item.lastfm_genres.split(', ').slice(0, 6).map(g => (
                <span key={g} style={{ background: '#1a0d0d', color: '#d94343', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4 }}>{g}</span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginTop: 6, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
            <div>
              <div style={{ color: TEXT, fontSize: 26, fontWeight: 900 }}>
                {price ?? <span style={{ color: '#555', fontSize: 15, fontWeight: 400 }}>Price varies</span>}
              </div>
              {discogsPrice > 0 && <div style={{ color: '#059669', fontSize: 11, fontWeight: 600, marginTop: 2 }}>Discogs from ${discogsPrice.toFixed(2)}</div>}
            </div>
            <button
              onClick={() => onAdd(item)}
              style={{
                background: inCart ? 'transparent' : ORANGE, color: inCart ? ORANGE : '#fff',
                border: inCart ? `2px solid ${ORANGE}` : 'none',
                borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
              }}
              onMouseEnter={e => { if (!inCart) e.currentTarget.style.background = '#e05a28' }}
              onMouseLeave={e => { if (!inCart) e.currentTarget.style.background = inCart ? 'transparent' : ORANGE }}
            >
              {inCart ? 'In Cart' : 'Add to Cart'}
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
      <div style={{ color: MUTED, fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ color: '#ccc', fontSize: 12, fontWeight: 500, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer({ cart, onClose, onRemove, onQty }: {
  cart: CartItem[]; onClose: () => void; onRemove: (id: string) => void; onQty: (id: string, q: number) => void
}) {
  const subtotal = cart.reduce((s, c) => s + (c.avg_price || 0) * c.quantity, 0)
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0)
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 400, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, background: CARD2, borderLeft: `1px solid ${BORDER}`, zIndex: 401, display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.24s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: TEXT, fontSize: 16, fontWeight: 700 }}>Cart {totalItems > 0 ? `(${totalItems})` : ''}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>x</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: MUTED, paddingTop: 60, fontSize: 13 }}>Nothing here yet</div>
          ) : cart.map(item => {
            const img = httpsUrl(item.cover_url) || httpsUrl(item.thumbnail_url)
            return (
              <div key={item.catalog_object_id} style={{ display: 'flex', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ width: 46, height: 46, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: '#1a1a1a' }}>
                  {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <VinylPlaceholder size={46} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {item.artist_name && <div style={{ color: ORANGE, fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>{item.artist_name}</div>}
                  <div style={{ color: TEXT, fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.album_title || item.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <button onClick={() => onQty(item.catalog_object_id, item.quantity - 1)} style={{ width: 22, height: 22, background: '#222', border: `1px solid ${BORDER}`, borderRadius: 4, color: TEXT, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                      <span style={{ color: TEXT, fontSize: 11, minWidth: 12, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => onQty(item.catalog_object_id, item.quantity + 1)} style={{ width: 22, height: 22, background: '#222', border: `1px solid ${BORDER}`, borderRadius: 4, color: TEXT, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: TEXT, fontSize: 12, fontWeight: 700 }}>{item.avg_price > 0 ? fmtPrice(item.avg_price * item.quantity) : '--'}</span>
                      <button onClick={() => onRemove(item.catalog_object_id)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>x</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {cart.length > 0 && (
          <div style={{ padding: '14px 20px 20px', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: MUTED, fontSize: 12 }}>Subtotal</span>
              <span style={{ color: TEXT, fontSize: 17, fontWeight: 800 }}>{fmtPrice(subtotal) ?? '--'}</span>
            </div>
            <div style={{ color: '#444', fontSize: 10, marginBottom: 10 }}>Demo mode -- payment coming soon</div>
            <button style={{ width: '100%', background: ORANGE, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Request Purchase</button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function PBtn({ label, active, disabled, onClick }: { label: string; active?: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: active ? ORANGE : CARD, border: `1px solid ${active ? ORANGE : BORDER}`, color: disabled ? '#333' : active ? '#fff' : TEXT, borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: disabled ? 'default' : 'pointer', fontWeight: active ? 700 : 400, minWidth: 34 }}
    >{label}</button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ShopClient() {
  const supabase = createClient()

  // Summary
  const [summary, setSummary] = useState<Summary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  // Catalog items (always visible)
  const [items, setItems] = useState<ShopItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  // Filters driven by charts
  const [filterFormat, setFilterFormat] = useState('')
  const [filterGenre, setFilterGenre] = useState('')
  const [filterDecade, setFilterDecade] = useState(0)
  const [filterSearch, setFilterSearch] = useState('')
  const [timeMode, setTimeMode] = useState<'decade' | 'year'>('decade')

  // Detail + Cart
  const [detailItem, setDetailItem] = useState<ShopItem | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const cartQty = cart.reduce((s, c) => s + c.quantity, 0)
  const cartIds = new Set(cart.map(c => c.catalog_object_id))

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const hasFilters = !!(filterFormat || filterGenre || filterDecade || filterSearch)

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

  // ── Load catalog items ──────────────────────────────────────────────────────
  const fetchItems = useCallback(async (p: number) => {
    setLoading(true)
    const { data } = await supabase.rpc('get_shop_items', {
      p_search: filterSearch || null,
      p_format: filterFormat || null,
      p_condition: null,
      p_genre: filterGenre || null,
      p_decade: filterDecade || null,
      p_item_type: null,
      p_performance: null,
      p_sort: 'popular',
      p_page: p,
      p_page_size: PAGE_SIZE,
    })
    setLoading(false)
    if (data && data.length > 0) {
      setItems(data as ShopItem[])
      setTotalCount(Number((data as ShopItem[])[0].total_count))
    } else {
      setItems([])
      setTotalCount(0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterFormat, filterGenre, filterDecade, filterSearch])

  useEffect(() => {
    // Debounce search, instant for chart filters
    if (filterSearch) {
      clearTimeout(searchTimer.current)
      searchTimer.current = setTimeout(() => { setPage(1); fetchItems(1) }, 380)
      return () => clearTimeout(searchTimer.current)
    }
    setPage(1)
    fetchItems(1)
  }, [fetchItems, filterSearch])

  useEffect(() => {
    if (page > 1) fetchItems(page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // ── Bar click handlers (toggle on/off) ──────────────────────────────────────
  const handleFormat = (bar: ChartBar) => setFilterFormat(prev => prev === bar.label ? '' : bar.label)
  const handleGenre  = (bar: ChartBar) => setFilterGenre(prev => prev === bar.label ? '' : bar.label)
  const handleTime   = (bar: ChartBar) => {
    const val = bar.decade ?? (bar.label ? Math.floor(parseInt(bar.label) / 10) * 10 : 0)
    setFilterDecade(prev => prev === val ? 0 : val)
  }

  // ── Cart helpers ────────────────────────────────────────────────────────────
  const addToCart = (item: ShopItem) => {
    setCart(prev => prev.some(c => c.catalog_object_id === item.catalog_object_id) ? prev : [...prev, { ...item, quantity: 1 }])
  }
  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.catalog_object_id !== id))
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return }
    setCart(prev => prev.map(c => c.catalog_object_id === id ? { ...c, quantity: qty } : c))
  }
  const clearFilters = () => { setFilterFormat(''); setFilterGenre(''); setFilterDecade(0); setFilterSearch('') }

  // Pagination
  const pageNums = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const start = Math.max(1, Math.min(page - 3, totalPages - 6))
    return Array.from({ length: 7 }, (_, i) => start + i)
  })()

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
        button { font-family: inherit; }
      `}</style>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,10,0.96)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1680, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 16, height: 56 }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 22 22" style={{ marginRight: 4 }}>
              <circle cx="11" cy="11" r="10.5" fill="none" stroke={ORANGE} strokeWidth="1.5"/>
              <circle cx="11" cy="11" r="7" fill="none" stroke={ORANGE} strokeWidth="1" opacity="0.5"/>
              <circle cx="11" cy="11" r="1.5" fill={ORANGE}/>
            </svg>
            <span style={{ color: ORANGE, fontWeight: 800, fontSize: 16 }}>Dead Wax</span>
            <span style={{ color: TEXT, fontWeight: 300, fontSize: 16, marginLeft: 4 }}>Records</span>
          </a>

          <div style={{ flex: 1, maxWidth: 440, position: 'relative' }}>
            <input
              type="text" placeholder="Search artists, albums, titles..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              style={{ width: '100%', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '7px 12px 7px 32px', color: TEXT, fontSize: 13 }}
            />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: MUTED, fontSize: 14, pointerEvents: 'none' }}>&#x2315;</span>
            {filterSearch && <button onClick={() => setFilterSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>x</button>}
          </div>

          <div style={{ flex: 1 }} />

          {!loading && <span style={{ color: MUTED, fontSize: 11, flexShrink: 0 }}>{totalCount.toLocaleString()} items</span>}

          <button onClick={() => setCartOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: cartQty > 0 ? ORANGE : CARD, border: `1px solid ${cartQty > 0 ? ORANGE : BORDER}`, borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
            Cart{cartQty > 0 && <span style={{ background: '#fff', color: ORANGE, fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartQty > 9 ? '9+' : cartQty}</span>}
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ maxWidth: 1680, margin: '0 auto', display: 'flex', minHeight: 'calc(100vh - 56px)' }}>

        {/* ── Left: Chart Filters ── */}
        <aside style={{ width: 260, flexShrink: 0, borderRight: `1px solid ${BORDER}`, padding: '18px 14px', position: 'sticky', top: 56, maxHeight: 'calc(100vh - 56px)', overflowY: 'auto' }}>

          {/* Active filters */}
          {hasFilters && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
              {filterFormat && <Chip label={filterFormat} onRemove={() => setFilterFormat('')} />}
              {filterGenre && <Chip label={filterGenre} onRemove={() => setFilterGenre('')} />}
              {filterDecade > 0 && <Chip label={`${filterDecade}s`} onRemove={() => setFilterDecade(0)} />}
              {filterSearch && <Chip label={`"${filterSearch}"`} onRemove={() => setFilterSearch('')} />}
              <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: ORANGE, fontSize: 11, cursor: 'pointer', fontWeight: 600, padding: '2px 4px' }}>Clear all</button>
            </div>
          )}

          {summaryLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <div style={{ width: 24, height: 24, border: `2px solid ${BORDER}`, borderTopColor: ORANGE, borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
            </div>
          ) : summary && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <BarChart title="Format" data={summary.by_format}
                activeLabel={filterFormat || null} onBarClick={handleFormat} />

              <BarChart title="Genre" data={summary.by_genre}
                activeLabel={filterGenre || null} onBarClick={handleGenre} />

              {/* Decade / Year toggle */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: MUTED, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {timeMode === 'decade' ? 'Decade' : 'Year'}
                  </span>
                  <button
                    onClick={() => { setTimeMode(prev => prev === 'decade' ? 'year' : 'decade'); setFilterDecade(0) }}
                    style={{ background: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: 4, color: MUTED, fontSize: 10, padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {timeMode === 'decade' ? 'Show Years' : 'Show Decades'}
                  </button>
                </div>
                {timeMode === 'decade' ? (
                  <BarChart title="" data={summary.by_decade}
                    activeLabel={filterDecade > 0 ? `${filterDecade}s` : null} onBarClick={handleTime} />
                ) : (
                  <BarChart title="" data={summary.by_year?.slice(0, 25) ?? []}
                    activeLabel={null} onBarClick={handleTime} />
                )}
              </div>

              <BarChart title="Price Range" data={summary.by_price_range?.filter(b => b.label !== 'No Price') ?? []}
                activeLabel={null} onBarClick={() => {}} />
            </div>
          )}
        </aside>

        {/* ── Right: Catalog Grid ── */}
        <main style={{ flex: 1, padding: '18px 20px 48px', minWidth: 0 }}>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
              <div style={{ width: 40, height: 40, border: `3px solid ${BORDER}`, borderTopColor: ORANGE, borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
            </div>

          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', color: MUTED, padding: '80px 24px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 8 }}>No records found</div>
              <div style={{ fontSize: 13, marginBottom: 18 }}>Try broadening your search or clearing a filter</div>
              {hasFilters && (
                <button onClick={clearFilters} style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Clear Filters</button>
              )}
            </div>

          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {items.map(item => (
                  <ItemCard key={item.catalog_object_id} item={item} onClick={() => setDetailItem(item)} inCart={cartIds.has(item.catalog_object_id)} />
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 36, flexWrap: 'wrap' }}>
                  <PBtn label="Prev" disabled={page === 1} onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0) }} />
                  {pageNums.map(n => (
                    <PBtn key={n} label={String(n)} active={n === page} disabled={false} onClick={() => { setPage(n); window.scrollTo(0, 0) }} />
                  ))}
                  <PBtn label="Next" disabled={page === totalPages} onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0) }} />
                </div>
              )}
              {totalPages > 1 && (
                <div style={{ textAlign: 'center', color: MUTED, fontSize: 11, marginTop: 8 }}>
                  Page {page} of {totalPages}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Detail Modal */}
      {detailItem && (
        <ItemModal item={detailItem} onClose={() => setDetailItem(null)} onAdd={(item) => { addToCart(item); setDetailItem(null); setCartOpen(true) }} inCart={cartIds.has(detailItem.catalog_object_id)} />
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onRemove={removeFromCart} onQty={updateQty} />
      )}
    </div>
  )
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${ORANGE}1a`, border: `1px solid ${ORANGE}44`, color: ORANGE, fontSize: 11, padding: '3px 10px 3px 11px', borderRadius: 16 }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: ORANGE, cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>x</button>
    </span>
  )
}
