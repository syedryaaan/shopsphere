import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import Loader from '../components/Loader.jsx';
import { CATEGORIES } from '../utils/format.js';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    const handler = setTimeout(() => {
      setLoading(true);
      setError('');
      const params = { sort };
      if (searchInput.trim()) params.search = searchInput.trim();
      if (category) params.category = category;

      api
        .get('/products', { params })
        .then(({ data }) => setProducts(data))
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(handler);
  }, [searchInput, category, sort]);

  const resetFilters = () => {
    setSearchInput('');
    setCategory('');
    setSort('newest');
  };

  const hasActiveFilters = Boolean(searchInput || category || sort !== 'newest');

  return (
    <section>
      <div className="hero">
        <div className="hero-content">
          <span className="hero-badge">Discover Top Quality Products</span>
          <h1>Everything you need, in one sphere.</h1>
          <p className="hero-subtitle">Premium electronics, trending fashion, home essentials, and more — delivered swiftly across India.</p>
        </div>
      </div>

      <div className="filters-container card">
        <div className="search-box">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search products by name or description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button className="clear-btn" onClick={() => setSearchInput('')} title="Clear search">
              ✕
            </button>
          )}
        </div>

        <div className="filter-controls">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Sort by: Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>

          {hasActiveFilters && (
            <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
              Reset filters
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Loader text="Finding products..." />
      ) : products.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🔍</div>
          <h3>No products match your criteria</h3>
          <p className="muted">Try adjusting your search terms or filters to find what you are looking for.</p>
          {hasActiveFilters && (
            <button className="btn btn-sm" onClick={resetFilters}>
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
