// Dead Wax Records — Shop Client
// Johnny Outlaw, LLC — Designed in Rockwall, TX
'use client'

import { useEffect, useRef, useState } from 'react'
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

const FORMAT_LABELS: Record<string, string> = {
  'Vinyl / LP': 'LP',
  'CD': 'CD',
  'Cassette': 'Cass',
  '7" Single': '7"',
  '12" Single': '12"',
  'Other': 'Misc',
}

const FORMAT_COLORS: Record<string, string> = {
  LP:   '#7c3aed',
  CD:   '#0ea5e9',
  Cass: '#d97706',
  '7"': '#059669',
  '12"':'#7c3aed',
  Misc: '#374151',
}

const FORMATS = ['Vinyl / LP', 'CD', 'Cassette', '7" Single', '12" Single', 'Other']
const GENRES  = [
  'rock','hip hop','electronic','pop','alternative rock','hard rock',
  'indie rock','punk','soul','metal','ambient','jazz','synth-pop',
  'new wave','folk','r&b','funk','experimental','indie folk','grunge',
  'post-punk','dark wave','death metal','heavy metal','shoegaze',
]
const DECADES = [1950,1960,1970,1980,1990,2000,2010,2020]

// ─── Types ────────────────────────────────────────────────────────────────────
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
  release_year:      number | null
  record_label:      string | null
  release_type:      string | null
  total_count:       number
}

interface CartItem extends ShopItem { quantity: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtPrice(price: number) {
  if (!price || price === 0) return 'Price varies'
  return '$' + price.toFixed(2)
}

function httpsUrl(url: string | null) {
  if (!url) return null
  return url.replace(/^http:\/\//, 'https://')
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VinylPlaceholder({ label }: { label: string }) {
  return (
    <div style={{ width: '100%', aspectRatio: '1/1', background: '#0f0f0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <svg width="90" height="90" viewBox="0 0 90 90" aria-hidden="true">
        <circle cx="45" cy="45" r="44" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1.5"/>
        {[35,28,21,15].map(r => (
          <circle key={r} cx="45" cy="45" r={r} fill="none" stroke="#252525" strokeWidth="1"/>
        ))}
        <circle cx="45" cy="45" r="8" fill="#111"/>
        <circle cx="45" cy="45" r="4" fill={ORANGE} opacity="0.8"/>
        <circle cx="45" cy="45" r="1.5" fill="#111"/>
      </svg>
      <span style={{ color: '#444', fontSize: 11, textAlign: 'center', padding: '0 12px', lineHeight: '1.4', maxWidth: 160 }}>{label}</span>
    </div>
  )
}

function FormatBadge({ format }: { format: string | null }) {
  if (!format) return null
  const label = FORMAT_LABELS[format] ?? format.substring(0, 4)
  const bg    = FORMAT_COLORS[label] ?? '#374151'
  return (
    <span style={{ background: bg, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.05em', textTransform: 'uppercase', flexShrink: 0 }}>
      {label}
    </span>
  )
}

function ConditionBadge({ condition }: { condition: string | null }) {
  if (!condition) return null
  const isNew = condition === 'New'
  return (
    <span style={{ background: isNew ? '#052e16' : '#1c1917', color: isNew ? '#86efac' : '#a8a29e', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>
      {condition}
    </span>
  )
}

// ─── Item Card ────────────────────────────────────────────────────────────────
function ItemCard({ item, onAdd, inCart }: { item: ShopItem; onAdd: (i: ShopItem) => void; inCart: boolean }) {
  const [imgErr, setImgErr] = useState(false)
  const artUrl  = httpsUrl(item.thumbnail_url)
  const hasArt  = !!artUrl && !imgErr
  const isHot   = item.performance_tier === 'Hot'
  const isEnr   = !!item.artist_name
  const dispArtist = item.artist_name ?? null
  const dispTitle  = item.album_title  || item.name

  return (
    <div
      style={{ background: CARD, border: `1px solid ${isHot ? '#ff6b3533' : BORDER}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'transform 0.18s, box-shadow 0.18s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = isHot ? '0 8px 32px rgba(255,107,53,0.18)' : '0 8px 24px rgba(0,0,0,0.4)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Artwork */}
      <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: '#0f0f0f' }}>
        {hasArt ? (
          <img
            src={artUrl!}
            alt={dispTitle}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <VinylPlaceholder label={dispTitle} />
        )}

        {/* Dark gradient over artwork for text contrast */}
        {hasArt && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)' }} />
        )}

        {/* HOT badge */}
        {isHot && (
          <div style={{ position: 'absolute', top: 9, right: 9, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.1em' }}>
            HOT
          </div>
        )}

        {/* MusicBrainz enriched badge */}
        {isEnr && (
          <div style={{ position: 'absolute', top: 9, left: 9, background: 'rgba(0,0,0,0.65)', border: '1px solid #333', color: '#888', fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 20, letterSpacing: '0.04em', backdropFilter: 'blur(4px)' }}>
            MusicBrainz
          </div>
        )}

        {/* Times sold — bottom-left overlay on artwork */}
        {item.times_sold > 0 && hasArt && (
          <div style={{ position: 'absolute', bottom: 8, left: 10, color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>
            Sold {item.times_sold}×
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '13px 13px 14px', display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
        {/* Artist */}
        {dispArtist && (
          <div style={{ color: ORANGE, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {dispArtist}
          </div>
        )}

        {/* Title */}
        <div style={{ color: TEXT, fontSize: 13, fontWeight: 600, lineHeight: '1.35', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {dispTitle}
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
          <FormatBadge format={item.format} />
          <ConditionBadge condition={item.condition} />
          {item.genre && (
            <span style={{ color: '#555', fontSize: 10, textTransform: 'capitalize' }}>{item.genre}</span>
          )}
        </div>

        {/* Meta row: label + year */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 1 }}>
          {item.release_year && (
            <span style={{ color: MUTED, fontSize: 11 }}>{item.release_year}</span>
          )}
          {item.record_label && (
            <span style={{ color: '#444', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {item.record_label}
            </span>
          )}
        </div>

        {/* Times sold (no artwork case) */}
        {item.times_sold > 0 && !hasArt && (
          <div style={{ color: '#444', fontSize: 10 }}>Sold {item.times_sold}×</div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Price + cart */}
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: TEXT, fontSize: 17, fontWeight: 800 }}>
              {fmtPrice(item.avg_price)}
            </span>
            {item.release_type && (
              <span style={{ color: '#444', fontSize: 10, fontStyle: 'italic' }}>{item.release_type}</span>
            )}
          </div>
          <button
            onClick={() => onAdd(item)}
            style={{ width: '100%', background: inCart ? 'transparent' : ORANGE, color: inCart ? ORANGE : '#fff', border: inCart ? `1px solid ${ORANGE}` : 'none', borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { if (!inCart) e.currentTarget.style.background = '#e05a28' }}
            onMouseLeave={e => { if (!inCart) e.currentTarget.style.background = ORANGE }}
          >
            {inCart ? '✓ In Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Filter Sidebar ───────────────────────────────────────────────────────────
function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: 16, marginBottom: 16 }}>
      <div style={{ color: MUTED, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'block', width: '100%', textAlign: 'left', background: active ? `${ORANGE}1a` : 'transparent', color: active ? ORANGE : '#999', border: `1px solid ${active ? ORANGE + '55' : 'transparent'}`, borderRadius: 6, padding: '6px 10px', fontSize: 12.5, cursor: 'pointer', marginBottom: 2, transition: 'all 0.12s' }}
    >
      {label}
    </button>
  )
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer({ cart, onClose, onRemove, onQty }: { cart: CartItem[]; onClose: () => void; onRemove: (id: string) => void; onQty: (id: string, q: number) => void }) {
  const subtotal   = cart.reduce((s, c) => s + c.avg_price * c.quantity, 0)
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0)

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, backdropFilter: 'blur(2px)' }} />

      {/* Drawer */}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, background: CARD2, borderLeft: `1px solid ${BORDER}`, zIndex: 201, display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.24s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 18px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ color: TEXT, fontSize: 18, fontWeight: 700 }}>Your Cart</span>
            {totalItems > 0 && <span style={{ color: MUTED, fontSize: 13 }}>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 24, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>

        {/* Items list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: MUTED, paddingTop: 60 }}>
              <svg width="56" height="56" viewBox="0 0 56 56" style={{ margin: '0 auto 16px', display: 'block' }}>
                <circle cx="28" cy="28" r="27" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1.5"/>
                {[20,15,10].map(r => <circle key={r} cx="28" cy="28" r={r} fill="none" stroke="#252525" strokeWidth="1"/>)}
                <circle cx="28" cy="28" r="4" fill={ORANGE} opacity="0.5"/>
              </svg>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#555', marginBottom: 6 }}>Nothing here yet</div>
              <div style={{ fontSize: 13 }}>Browse the shop and add something you love</div>
            </div>
          ) : (
            cart.map(item => {
              const img = httpsUrl(item.thumbnail_url)
              const title = item.album_title || item.name
              return (
                <div key={item.catalog_object_id} style={{ display: 'flex', gap: 13, paddingBottom: 18, marginBottom: 18, borderBottom: `1px solid ${BORDER}` }}>
                  {/* Thumb */}
                  <div style={{ width: 58, height: 58, borderRadius: 7, overflow: 'hidden', flexShrink: 0, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {img ? (
                      <img src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="14" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1"/><circle cx="15" cy="15" r="5" fill="none" stroke="#333" strokeWidth="1"/><circle cx="15" cy="15" r="2" fill={ORANGE} opacity="0.6"/></svg>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {item.artist_name && <div style={{ color: ORANGE, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.artist_name}</div>}
                    <div style={{ color: TEXT, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{title}</div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <FormatBadge format={item.format} />
                      <ConditionBadge condition={item.condition} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      {/* Qty controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => onQty(item.catalog_object_id, item.quantity - 1)} style={{ width: 26, height: 26, background: '#222', border: `1px solid ${BORDER}`, borderRadius: 5, color: TEXT, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ color: TEXT, fontSize: 13, minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => onQty(item.catalog_object_id, item.quantity + 1)} style={{ width: 26, height: 26, background: '#222', border: `1px solid ${BORDER}`, borderRadius: 5, color: TEXT, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: TEXT, fontSize: 14, fontWeight: 700 }}>
                          {item.avg_price > 0 ? fmtPrice(item.avg_price * item.quantity) : 'Varies'}
                        </span>
                        <button onClick={() => onRemove(item.catalog_object_id)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 18, lineHeight: 1 }} title="Remove">×</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '18px 24px 24px', borderTop: `1px solid ${BORDER}` }}>
            {/* Subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ color: MUTED, fontSize: 14 }}>Subtotal</span>
              <span style={{ color: TEXT, fontSize: 20, fontWeight: 800 }}>{fmtPrice(subtotal)}</span>
            </div>
            {/* Demo note */}
            <div style={{ background: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: ORANGE, fontSize: 14 }}>⚡</span>
              <span style={{ color: MUTED, fontSize: 12, lineHeight: '1.4' }}>Demo mode — payment integration coming soon</span>
            </div>
            {/* CTA */}
            <button style={{ width: '100%', background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, padding: '15px 0', fontSize: 15, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.02em' }}
              onMouseEnter={e => e.currentTarget.style.background = '#e05a28'}
              onMouseLeave={e => e.currentTarget.style.background = ORANGE}
            >
              Request Purchase
            </button>
            <button onClick={onClose} style={{ width: '100%', marginTop: 10, background: 'transparent', color: MUTED, border: 'none', fontSize: 13, cursor: 'pointer', padding: '8px 0' }}>
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Active filter chip ───────────────────────────────────────────────────────
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${ORANGE}1a`, border: `1px solid ${ORANGE}44`, color: ORANGE, fontSize: 12, padding: '4px 10px 4px 12px', borderRadius: 20 }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: ORANGE, cursor: 'pointer', padding: 0, fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'center' }}>×</button>
    </span>
  )
}

// ─── Pagination button ────────────────────────────────────────────────────────
function PBtn({ label, active, disabled, onClick }: { label: string; active?: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ background: active ? ORANGE : CARD, border: `1px solid ${active ? ORANGE : BORDER}`, color: disabled ? '#333' : active ? '#fff' : TEXT, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: disabled ? 'default' : 'pointer', fontWeight: active ? 700 : 400, minWidth: 38, transition: 'all 0.12s' }}
    >
      {label}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ShopClient() {
  const supabase = createClient()

  // Data
  const [items,      setItems]      = useState<ShopItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading,    setLoading]    = useState(true)

  // Filters
  const [search,    setSearch]    = useState('')
  const [format,    setFormat]    = useState('')
  const [condition, setCondition] = useState('')
  const [genre,     setGenre]     = useState('')
  const [decade,    setDecade]    = useState(0)
  const [itemType,  setItemType]  = useState('')
  const [hotOnly,   setHotOnly]   = useState(false)
  const [sort,      setSort]      = useState('popular')
  const [page,      setPage]      = useState(1)

  // UI state
  const [cart,      setCart]      = useState<CartItem[]>([])
  const [cartOpen,  setCartOpen]  = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const totalPages  = Math.ceil(totalCount / PAGE_SIZE)
  const cartQty     = cart.reduce((s, c) => s + c.quantity, 0)
  const cartIds     = new Set(cart.map(c => c.catalog_object_id))

  const hasFilters = !!(format || condition || genre || decade || itemType || hotOnly || search)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const isSearch = !!search
    const delay    = isSearch ? 380 : 0

    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      if (cancelled) return
      setLoading(true)
      const { data } = await supabase.rpc('get_shop_items', {
        p_search:      search      || null,
        p_format:      format      || null,
        p_condition:   condition   || null,
        p_genre:       genre       || null,
        p_decade:      decade      || null,
        p_item_type:   itemType    || null,
        p_performance: hotOnly     ? 'Hot' : null,
        p_sort:        sort,
        p_page:        page,
        p_page_size:   PAGE_SIZE,
      })
      if (cancelled) return
      setLoading(false)
      if (data && data.length > 0) {
        setItems(data as ShopItem[])
        setTotalCount(Number(data[0].total_count))
      } else {
        setItems([])
        setTotalCount(0)
      }
    }, delay)

    return () => { cancelled = true; clearTimeout(searchTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, format, condition, genre, decade, itemType, hotOnly, sort, page])

  // Reset page when non-page filters change
  useEffect(() => { setPage(1) }, [search, format, condition, genre, decade, itemType, hotOnly, sort])

  // ── Cart ───────────────────────────────────────────────────────────────────
  const addToCart = (item: ShopItem) => {
    setCart(prev => prev.some(c => c.catalog_object_id === item.catalog_object_id)
      ? prev
      : [...prev, { ...item, quantity: 1 }]
    )
    setCartOpen(true)
  }

  const removeFromCart = (id: string) =>
    setCart(prev => prev.filter(c => c.catalog_object_id !== id))

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return }
    setCart(prev => prev.map(c => c.catalog_object_id === id ? { ...c, quantity: qty } : c))
  }

  const clearFilters = () => {
    setFormat(''); setCondition(''); setGenre('')
    setDecade(0);  setItemType(''); setHotOnly(false); setSearch('')
  }

  // ── Pagination pages to show ───────────────────────────────────────────────
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
        @keyframes spin         { to   { transform: rotate(360deg) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar       { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
        input:focus { outline: none; border-color: ${ORANGE} !important; }
        select { appearance: none; }
      `}</style>

      {/* ── Header ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,10,0.96)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1680, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 18, height: 64 }}>

          {/* Brand */}
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" style={{ marginRight: 6 }}>
              <circle cx="11" cy="11" r="10.5" fill="none" stroke={ORANGE} strokeWidth="1.5"/>
              <circle cx="11" cy="11" r="7"    fill="none" stroke={ORANGE} strokeWidth="1" opacity="0.5"/>
              <circle cx="11" cy="11" r="3"    fill="none" stroke={ORANGE} strokeWidth="1" opacity="0.3"/>
              <circle cx="11" cy="11" r="1.5"  fill={ORANGE}/>
            </svg>
            <span style={{ color: ORANGE, fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>Dead Wax</span>
            <span style={{ color: TEXT, fontWeight: 300, fontSize: 18, marginLeft: 5 }}>Records</span>
          </a>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 520, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED, fontSize: 17, pointerEvents: 'none' }}>⌕</span>
            <input
              type="text"
              placeholder="Search artists, albums, titles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '9px 36px 9px 38px', color: TEXT, fontSize: 14, transition: 'border-color 0.15s' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Results count */}
          {!loading && (
            <span style={{ color: MUTED, fontSize: 13, flexShrink: 0 }}>
              {totalCount.toLocaleString()} item{totalCount !== 1 ? 's' : ''}
            </span>
          )}

          {/* Sort */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, padding: '8px 32px 8px 12px', fontSize: 13, cursor: 'pointer' }}
            >
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="newest">Newest Releases</option>
              <option value="name">Name A–Z</option>
            </select>
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: MUTED, fontSize: 10, pointerEvents: 'none' }}>▾</span>
          </div>

          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: cartQty > 0 ? ORANGE : CARD, border: `1px solid ${cartQty > 0 ? ORANGE : BORDER}`, borderRadius: 10, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
            onMouseEnter={e => { if (cartQty === 0) e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.color = ORANGE }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = cartQty > 0 ? ORANGE : BORDER; e.currentTarget.style.color = '#fff' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span>Cart</span>
            {cartQty > 0 && (
              <span style={{ background: '#fff', color: ORANGE, fontSize: 11, fontWeight: 800, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {cartQty > 9 ? '9+' : cartQty}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1680, margin: '0 auto', display: 'flex' }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: 232, flexShrink: 0, borderRight: `1px solid ${BORDER}`, padding: '24px 18px', position: 'sticky', top: 64, maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          {/* Sidebar header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ color: TEXT, fontSize: 14, fontWeight: 700 }}>Filters</span>
            {hasFilters && (
              <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: ORANGE, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Clear all</button>
            )}
          </div>

          {/* Format */}
          <FilterSection label="Format">
            <FilterBtn label="All Formats" active={!format} onClick={() => setFormat('')} />
            {FORMATS.map(f => (
              <FilterBtn key={f} label={f} active={format === f} onClick={() => setFormat(format === f ? '' : f)} />
            ))}
          </FilterSection>

          {/* Condition */}
          <FilterSection label="Condition">
            <FilterBtn label="All" active={!condition} onClick={() => setCondition('')} />
            <FilterBtn label="New" active={condition === 'New'} onClick={() => setCondition(condition === 'New' ? '' : 'New')} />
            <FilterBtn label="Used" active={condition === 'Used'} onClick={() => setCondition(condition === 'Used' ? '' : 'Used')} />
          </FilterSection>

          {/* Genre */}
          <FilterSection label="Genre">
            <FilterBtn label="All Genres" active={!genre} onClick={() => setGenre('')} />
            {GENRES.map(g => (
              <FilterBtn key={g} label={capitalize(g)} active={genre === g} onClick={() => setGenre(genre === g ? '' : g)} />
            ))}
          </FilterSection>

          {/* Decade */}
          <FilterSection label="Era / Decade">
            <FilterBtn label="All Eras" active={!decade} onClick={() => setDecade(0)} />
            {DECADES.map(d => (
              <FilterBtn key={d} label={`${d}s`} active={decade === d} onClick={() => setDecade(decade === d ? 0 : d)} />
            ))}
          </FilterSection>

          {/* Item Type */}
          <FilterSection label="Item Type">
            <FilterBtn label="All Items"       active={!itemType}                    onClick={() => setItemType('')} />
            <FilterBtn label="Named Releases"  active={itemType === 'Named Release'} onClick={() => setItemType(itemType === 'Named Release' ? '' : 'Named Release')} />
            <FilterBtn label="General Stock"   active={itemType === 'Generic Stock'} onClick={() => setItemType(itemType === 'Generic Stock'  ? '' : 'Generic Stock')} />
          </FilterSection>

          {/* Hot Only toggle */}
          <button
            onClick={() => setHotOnly(!hotOnly)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: hotOnly ? '#ef444418' : 'transparent', border: `1px solid ${hotOnly ? '#ef444455' : BORDER}`, borderRadius: 8, padding: '10px 12px', cursor: 'pointer', color: hotOnly ? '#ef4444' : MUTED, fontSize: 13, fontWeight: 700, transition: 'all 0.15s' }}
          >
            <span>🔥 Hot Items Only</span>
            <span style={{ width: 32, height: 18, background: hotOnly ? '#ef4444' : '#222', borderRadius: 9, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: 2, left: hotOnly ? 16 : 2, width: 14, height: 14, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
            </span>
          </button>

          {/* Enrichment callout */}
          <div style={{ marginTop: 24, padding: '12px 14px', background: '#0d0d0d', border: `1px solid #1a1a1a`, borderRadius: 10 }}>
            <div style={{ color: '#555', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Powered by</div>
            <div style={{ color: '#888', fontSize: 11, lineHeight: '1.5' }}>
              Catalog enriched via <span style={{ color: '#ba11ff', fontWeight: 600 }}>MusicBrainz</span> — artist names, genres, release dates &amp; album art from Square POS data.
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, padding: '24px 24px 48px', minWidth: 0 }}>

          {/* Active filter chips */}
          {hasFilters && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {search    && <Chip label={`"${search}"`}      onRemove={() => setSearch('')} />}
              {format    && <Chip label={format}             onRemove={() => setFormat('')} />}
              {condition && <Chip label={condition}          onRemove={() => setCondition('')} />}
              {genre     && <Chip label={capitalize(genre)}  onRemove={() => setGenre('')} />}
              {decade > 0 && <Chip label={`${decade}s`}     onRemove={() => setDecade(0)} />}
              {itemType  && <Chip label={itemType}           onRemove={() => setItemType('')} />}
              {hotOnly   && <Chip label="Hot Only"           onRemove={() => setHotOnly(false)} />}
            </div>
          )}

          {/* Loading spinner */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
              <div style={{ width: 44, height: 44, border: `3px solid ${BORDER}`, borderTopColor: ORANGE, borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
            </div>

          /* Empty state */
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', color: MUTED, padding: '80px 24px' }}>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ margin: '0 auto 20px', display: 'block', opacity: 0.4 }}>
                <circle cx="32" cy="32" r="31" fill="none" stroke={TEXT} strokeWidth="1.5"/>
                <circle cx="32" cy="32" r="20" fill="none" stroke={TEXT} strokeWidth="1" opacity="0.5"/>
                <circle cx="32" cy="32" r="4"  fill={TEXT} opacity="0.5"/>
              </svg>
              <div style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 8 }}>No records found</div>
              <div style={{ fontSize: 14, marginBottom: 20 }}>Try broadening your search or clearing a filter</div>
              {hasFilters && (
                <button onClick={clearFilters} style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                  Clear Filters
                </button>
              )}
            </div>

          /* Grid */
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {items.map(item => (
                  <ItemCard key={item.catalog_object_id} item={item} onAdd={addToCart} inCart={cartIds.has(item.catalog_object_id)} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 44, flexWrap: 'wrap' }}>
                  <PBtn label="← Prev" disabled={page === 1}          onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0,0) }} />
                  {pageNums.map(n => (
                    <PBtn key={n} label={String(n)} active={n === page} disabled={false} onClick={() => { setPage(n); window.scrollTo(0,0) }} />
                  ))}
                  <PBtn label="Next →" disabled={page === totalPages} onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0,0) }} />
                </div>
              )}

              {/* Page indicator */}
              {totalPages > 1 && (
                <div style={{ textAlign: 'center', color: MUTED, fontSize: 12, marginTop: 12 }}>
                  Page {page} of {totalPages} · {totalCount.toLocaleString()} total items
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onRemove={removeFromCart} onQty={updateQty} />
      )}
    </div>
  )
}
