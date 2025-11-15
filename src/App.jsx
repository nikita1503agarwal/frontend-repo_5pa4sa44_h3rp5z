import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function formatCurrency(n) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n)
  } catch {
    return `$${n}`
  }
}

function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products..."
        className="w-full rounded-xl border border-gray-200 bg-white/80 backdrop-blur px-4 py-3 pl-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
    </div>
  )
}

function ProductCard({ item }) {
  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-xl">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-50">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">No Image</div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold text-gray-800">{item.title}</h3>
          {item.in_stock ? (
            <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">In stock</span>
          ) : (
            <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Out</span>
          )}
        </div>
        {item.rating && (
          <div className="text-sm text-amber-600">⭐ {item.rating} <span className="text-gray-400">({item.reviews_count || 0})</span></div>
        )}
        <div className="mt-2 flex items-center justify-between">
          <div className="text-lg font-bold text-gray-900">{formatCurrency(item.price)}</div>
          <button className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Add to cart</button>
        </div>
      </div>
    </div>
  )
}

function CategoryChips({ active, setActive, categories }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => setActive('')} className={`rounded-full px-3 py-1 text-sm ${active === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'} border`}>All</button>
      {categories.map((c) => (
        <button key={c} onClick={() => setActive(c)} className={`rounded-full px-3 py-1 text-sm ${active === c ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'} border`}>{c}</button>
      ))}
    </div>
  )
}

function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')

  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category).filter(Boolean))
    return Array.from(set)
  }, [items])

  const fetchProducts = async (opts = {}) => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (opts.category) params.append('category', opts.category)
      if (opts.q) params.append('q', opts.q)
      const res = await fetch(`${API_BASE}/api/products?${params.toString()}`)
      const data = await res.json()
      setItems(data.items || [])
    } catch (e) {
      console.error(e)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/seed`, { method: 'POST' }).finally(() => fetchProducts())
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchProducts({ category, q: query }), 300)
    return () => clearTimeout(t)
  }, [query, category])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛒</span>
              <div>
                <div className="text-lg font-bold">ShopEasy</div>
                <div className="text-xs text-gray-500">Find your next favorite</div>
              </div>
            </div>
            <div className="w-full max-w-xl">
              <SearchBar value={query} onChange={setQuery} />
            </div>
            <button className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cart (0)</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <CategoryChips active={category} setActive={setCategory} categories={categories} />
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="h-64 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-600">No products found</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <ProductCard key={item.id || item._id} item={item} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-gray-500">© {new Date().getFullYear()} ShopEasy — Inspired by the best of Amazon & Daraz</div>
      </footer>
    </div>
  )
}

export default App
