import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  Search,
  RefreshCw,
  Trash2,
  AlertCircle,
  Store,
  ChevronRight,
  TrendingUp,
  Award,
  CheckCircle2,
  Package,
  User,
  Filter,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

export default function ProductReviews() {
  const { stores, selectedStoreId, setSelectedStoreId, selectedStore } = useStore();

  // Data states
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviews, setReviews] = useState([]);

  // Loading & error states
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All'); // 'All' | '5' | '4' | '3' | '2' | '1'
  const [onlyWithReviews, setOnlyWithReviews] = useState(true);

  // Toast notification
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Fetch Store Summary & Products
  const fetchStoreProductsAndSummary = async () => {
    if (!selectedStoreId) return;

    setLoadingProducts(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch summary
      const sumRes = await fetch(`${API_BASE}/api/super-admin/reviews/store/${selectedStoreId}/summary`, { headers });
      const sumData = await sumRes.json();
      if (sumRes.ok && sumData.success) {
        setSummary(sumData.data);
      }

      // Fetch products for this store
      const prodRes = await fetch(`${API_BASE}/api/super-admin/reviews/store/${selectedStoreId}/products`, { headers });
      const prodData = await prodRes.json();

      if (prodRes.ok && prodData.success) {
        const prodList = prodData.products || [];
        setProducts(prodList);

        // Auto-select first product with reviews or first available product
        if (prodList.length > 0) {
          const firstWithRev = prodList.find(p => p.total_reviews > 0) || prodList[0];
          setSelectedProduct(firstWithRev);
        } else {
          setSelectedProduct(null);
        }
      } else {
        setError(prodData.message || 'Failed to fetch store products.');
      }
    } catch (err) {
      console.error('Error fetching store review data:', err);
      setError('Network error connecting to backend.');
    } finally {
      setLoadingProducts(false);
    }
  };

  // 2. Fetch Reviews for Selected Product in Selected Store
  const fetchProductReviews = async (productId) => {
    if (!selectedStoreId || !productId) {
      setReviews([]);
      return;
    }

    setLoadingReviews(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (ratingFilter !== 'All') params.append('rating', ratingFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE}/api/super-admin/reviews/store/${selectedStoreId}/product/${productId}${qs}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setReviews(data.reviews || []);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('Error fetching product reviews:', err);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Trigger on store change
  useEffect(() => {
    fetchStoreProductsAndSummary();
  }, [selectedStoreId]);

  // Trigger on product selection or filter change
  useEffect(() => {
    if (selectedProduct) {
      fetchProductReviews(selectedProduct.id);
    }
  }, [selectedProduct?.id, ratingFilter, searchTerm]);

  // Delete Review handler
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this customer review?')) return;

    setDeletingId(reviewId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/super-admin/reviews/store/${selectedStoreId}/review/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Review deleted successfully.', 'success');
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        // Refresh products and summary counts
        fetchStoreProductsAndSummary();
      } else {
        showToast(data.message || 'Failed to delete review.', 'error');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      showToast('Network error deleting review.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter products list based on view toggle & search
  const visibleProducts = products.filter(p => {
    if (onlyWithReviews && p.total_reviews === 0) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = (p.title || '').toLowerCase().includes(term);
      return matchTitle;
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-200 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold transition-all transform animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            : 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          {toast.message}
        </div>
      )}

      {/* Header & Store Selector Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Product Reviews
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>Store-specific product reviews & customer feedback</span>
            {selectedStore && (
              <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full text-xs border border-blue-200 dark:border-blue-900">
                <Store className="w-3 h-3" /> {selectedStore.store_name}
              </span>
            )}
          </p>
        </div>

        {/* Store Selector & Refresh Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dark Store Selector */}
          <div className="relative">
            <select
              value={selectedStoreId || ''}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pr-9 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {stores.map(s => (
                <option key={s.id} value={s.id}>
                  🏬 {s.store_name} ({s.status || 'Active'})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>

          <button
            onClick={() => {
              fetchStoreProductsAndSummary();
              if (selectedProduct) fetchProductReviews(selectedProduct.id);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingProducts ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary KPI Cards for Selected Store */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Store Reviews</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{summary.total_reviews}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Store Rating</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-amber-500">{summary.average_rating || '0.0'}</span>
                <span className="text-xs text-slate-400">/ 5.0</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">5★ Positive Rate</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{summary.five_star_percentage}%</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reviewed Products</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {summary.reviewed_products_count} <span className="text-xs text-slate-400 font-normal">/ {products.length} Products</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area: Products List (Left) & Reviews Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Selection & Catalog (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-500" />
                Store Products
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
                {visibleProducts.length}
              </span>
            </div>

            {/* Search within Store */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Toggle: Only with reviews */}
            <button
              onClick={() => setOnlyWithReviews(prev => !prev)}
              className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                onlyWithReviews
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <span>Only with reviews</span>
              <span className={`w-2 h-2 rounded-full ${onlyWithReviews ? 'bg-blue-600' : 'bg-slate-400'}`} />
            </button>

            {/* Products Scroll List */}
            <div className="max-h-[580px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loadingProducts ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  <p className="text-xs">Loading products...</p>
                </div>
              ) : visibleProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-semibold">No products found</p>
                  <p className="text-[10px]">Try changing the search or toggle.</p>
                </div>
              ) : (
                visibleProducts.map((p) => {
                  const isSelected = selectedProduct?.id === p.id;
                  const imgUrl = getImageUrl(p.image_url);

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
                          : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Product Thumbnail */}
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={p.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      {/* Product Title & Review Meta */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {p.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            ₹{p.price}
                          </span>
                          {p.unit && (
                            <span className="text-[10px] text-slate-400 truncate">
                              • {p.unit}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-[11px] font-bold text-amber-500">
                              {p.average_rating > 0 ? p.average_rating : '-'}
                            </span>
                          </div>

                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            p.total_reviews > 0
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}>
                            {p.total_reviews} {p.total_reviews === 1 ? 'Review' : 'Reviews'}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${
                        isSelected ? 'text-blue-600 dark:text-blue-400 translate-x-0.5' : 'text-slate-300 dark:text-slate-600'
                      }`} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Product Card & Individual Customer Reviews (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedProduct ? (
            <>
              {/* Active Product Header Banner */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-150 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                      {getImageUrl(selectedProduct.image_url) ? (
                        <img
                          src={getImageUrl(selectedProduct.image_url)}
                          alt={selectedProduct.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          {selectedProduct.title}
                        </h2>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          selectedProduct.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {selectedProduct.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Price: <span className="font-bold text-slate-800 dark:text-slate-200">₹{selectedProduct.price}</span>
                        {selectedProduct.unit && ` · Unit: ${selectedProduct.unit}`}
                        {selectedProduct.quantity !== undefined && ` · Stock: ${selectedProduct.quantity}`}
                      </p>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex sm:flex-col items-start sm:items-end justify-between gap-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Star className="w-5 h-5 fill-amber-400" />
                      <span className="text-xl font-bold">{selectedProduct.average_rating || '0.0'}</span>
                      <span className="text-xs text-slate-400">/ 5</span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      Based on {selectedProduct.total_reviews} {selectedProduct.total_reviews === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                </div>

                {/* Rating Distribution Bar Meter (5★ to 1★) */}
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {[5, 4, 3, 2, 1].map((starNum) => {
                    const count = selectedProduct.rating_counts?.[starNum] || 0;
                    const pct = selectedProduct.total_reviews > 0 ? (count / selectedProduct.total_reviews) * 100 : 0;
                    const isFilterActive = ratingFilter === String(starNum);

                    return (
                      <button
                        key={starNum}
                        onClick={() => setRatingFilter(isFilterActive ? 'All' : String(starNum))}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isFilterActive
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 ring-1 ring-amber-400'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            {starNum} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">{count}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter Tabs & Search for Individual Reviews */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                  {['All', '5', '4', '3', '2', '1'].map((r) => {
                    const isActive = ratingFilter === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setRatingFilter(r)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {r === 'All' ? 'All Reviews' : `${r} ★`}
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Showing {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'} for this store
                </div>
              </div>

              {/* Individual Reviews List */}
              <div className="space-y-3">
                {loadingReviews ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                    <p className="text-xs">Loading customer reviews...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No Customer Reviews Found
                    </p>
                    <p className="text-xs text-slate-400">
                      {ratingFilter !== 'All'
                        ? `No ${ratingFilter}★ reviews found for this product in ${selectedStore?.store_name || 'this store'}.`
                        : `This product has not received any reviews yet in ${selectedStore?.store_name || 'this store'}.`}
                    </p>
                  </div>
                ) : (
                  reviews.map((rev) => {
                    const initials = (rev.customer_name || 'U').charAt(0).toUpperCase();
                    const dateFormatted = new Date(rev.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={rev.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Customer Avatar & Name */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                  {rev.customer_name}
                                </h4>
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" /> Verified Buyer
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                {rev.customer_phone ? `📞 ${rev.customer_phone}` : ''}
                                {rev.customer_phone && rev.customer_email ? ' · ' : ''}
                                {rev.customer_email || ''}
                              </p>
                            </div>
                          </div>

                          {/* Delete Review Action */}
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            disabled={deletingId === rev.id}
                            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                            title="Delete this review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Stars & Date */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1 text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${
                                  s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-1.5">
                              {rev.rating}.0
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400">
                            {dateFormatted}
                          </span>
                        </div>

                        {/* Review Text Body */}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {rev.review ? (
                            <p>{rev.review}</p>
                          ) : (
                            <p className="italic text-slate-400">Rating given without written feedback.</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center text-slate-400 space-y-3">
              <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Select a Product</h3>
              <p className="text-xs text-slate-400">
                Choose any product from the catalog on the left to view customer reviews for this Dark Store.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
