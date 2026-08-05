import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Trash2, 
  Edit, 
  AlertCircle, 
  Star, 
  Search, 
  RefreshCw, 
  X
} from 'lucide-react';

const REVIEWS_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000') + '/api/product-reviews';
const PRODUCTS_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000') + '/api/products-detail';

const ProductReviews = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [reviews, setReviews] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All'); // 'All', '1', '2', '3', '4', '5'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState('');
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Toast Notification State
  const [notification, setNotification] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch all products
  const fetchProductsList = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setProductsLoading(true);
    setError(null);
    try {
      const response = await fetch(PRODUCTS_API_BASE_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.status === 200 && data.success) {
        setProducts(data.products || []);
        // Automatically select first product if available and none selected
        if (data.products && data.products.length > 0 && !selectedProductId) {
          setSelectedProductId(data.products[0].id);
        }
      } else {
        setError(data.message || 'Failed to load products list.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server to fetch products.');
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch reviews for a specific product
  const fetchReviews = async (productId) => {
    if (!productId) return;
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setReviewsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${REVIEWS_API_BASE_URL}?product_id=${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.status === 200 && data.success) {
        setReviews(data.reviews || []);
      } else {
        setReviews([]);
        // Some products might not have reviews yet, handle message
        if (response.status !== 400) {
          setError(data.message || 'Failed to load reviews.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server to fetch reviews.');
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsList();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchReviews(selectedProductId);
    } else {
      setReviews([]);
    }
  }, [selectedProductId]);

  // Open Edit modal
  const handleOpenEditModal = (reviewItem) => {
    setEditingReview(reviewItem);
    setFormRating(reviewItem.rating);
    setFormText(reviewItem.review || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    if (!token || !editingReview) return;

    setFormLoading(true);
    setFormError(null);

    try {
      const response = await fetch(`${REVIEWS_API_BASE_URL}/${editingReview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: formRating,
          review: formText
        })
      });

      const data = await response.json();

      if (response.status === 200 && data.success) {
        triggerToast('Review updated successfully.', 'success');
        // Refresh local reviews state
        setReviews(prev => prev.map(item => item.id === editingReview.id ? { ...item, rating: formRating, review: formText, updated_at: new Date().toISOString() } : item));
        setIsModalOpen(false);
      } else {
        setFormError(data.message || 'Failed to update review details.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Network connection failed.');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Review
  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product review?')) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch(`${REVIEWS_API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.status === 200 && data.success) {
        triggerToast('Review deleted successfully.', 'success');
        setReviews(prev => prev.filter(item => item.id !== id));
      } else {
        triggerToast(data.message || 'Failed to delete review.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Connection failed.', 'error');
    }
  };

  // Filter & Search Logic
  const filteredReviews = reviews.filter(rev => {
    const userEmail = rev.user?.email || rev.user_id || '';
    const reviewText = rev.review || '';
    const matchesSearch = 
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reviewText.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating = ratingFilter === 'All' ? true : rev.rating === parseInt(ratingFilter, 10);

    return matchesSearch && matchesRating;
  });

  const getSelectedProductDetails = () => {
    return products.find(p => p.id === selectedProductId);
  };

  const selectedProduct = getSelectedProductDetails();

  return (
    <div className="space-y-6 font-sans relative animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 transform translate-y-0 ${
          notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full mr-2.5 bg-current ${notification.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`} />
          {notification.message}
        </div>
      )}

      {/* Header section */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="text-blue-600" />
          <span>Product Reviews Management</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">View, filter, update, or remove customer reviews for individual catalog products.</p>
      </div>

      {/* Main product selector panel */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Select Catalog Product</label>
          <div className="relative">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs text-slate-800 font-semibold focus:border-blue-500 focus:outline-none appearance-none"
              disabled={productsLoading}
            >
              {productsLoading ? (
                <option>Loading catalog products...</option>
              ) : products.length === 0 ? (
                <option>No products available</option>
              ) : (
                products.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.title} (₹{prod.price}) - {prod.description || '1 Unit'}
                  </option>
                ))
              )}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-500">
              ▼
            </div>
          </div>
        </div>

        {selectedProduct && (
          <div className="flex items-center gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex-shrink-0 self-stretch sm:self-auto justify-start">
            <div className="w-10 h-10 rounded-lg bg-white border border-slate-150 flex items-center justify-center font-bold text-lg shadow-sm">
              {selectedProduct.emoji || '📦'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">{selectedProduct.title}</div>
              <div className="text-[10px] text-slate-400 font-semibold">Price: ₹{selectedProduct.price} · Category ID: {selectedProduct.category_id}</div>
            </div>
          </div>
        )}
      </div>

      {/* Reviews view container */}
      {selectedProductId ? (
        <div className="space-y-6">
          {/* Controls bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            {/* Rating Filter Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
              {['All', '5', '4', '3', '2', '1'].map((rating) => {
                const isActive = ratingFilter === rating;
                return (
                  <button
                    key={rating}
                    onClick={() => setRatingFilter(rating)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                      isActive 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-850'
                    }`}
                  >
                    {rating === 'All' ? 'All Ratings' : `${rating} ★`}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-initial">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search by reviewer email or text..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-64 py-2 pl-9 pr-4 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
                />
              </div>
              <button 
                onClick={() => fetchReviews(selectedProductId)}
                disabled={reviewsLoading}
                className="px-3.5 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={12} className={reviewsLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {/* Loader or Reviews List */}
          {reviewsLoading ? (
            <div className="py-20 text-center bg-white border border-slate-100 rounded-2xl shadow-sm">
              <span className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin inline-block"></span>
              <p className="text-xs text-slate-400 mt-3 font-semibold">Loading reviews...</p>
            </div>
          ) : error ? (
            <div className="p-8 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 max-w-lg mx-auto">
              <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-sm font-bold text-rose-900">Database Connection Error</h4>
                <p className="text-xs text-rose-700 mt-1">{error}</p>
                <button onClick={() => fetchReviews(selectedProductId)} className="text-xs font-bold text-rose-800 underline mt-2 hover:text-rose-900 cursor-pointer block">
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredReviews.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredReviews.map((rev) => (
                <div 
                  key={rev.id} 
                  className="bg-white border border-slate-200 hover:border-slate-350 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Review Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                          👤 {rev.user?.email || rev.user_id || 'Anonymous'}
                        </span>
                        
                        {/* Rating Stars */}
                        <div className="flex items-center text-amber-500 gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star 
                              key={idx} 
                              size={14} 
                              fill={idx < rev.rating ? 'currentColor' : 'none'} 
                              className={idx < rev.rating ? 'text-amber-400' : 'text-slate-300'}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Review text */}
                      <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        {rev.review || <span className="italic text-slate-400">No review text provided, just rating.</span>}
                      </p>

                      <div className="text-[9px] font-semibold text-slate-400 flex items-center gap-2">
                        <span>Submitted: {new Date(rev.created_at).toLocaleString()}</span>
                        {rev.updated_at && (
                          <span className="text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                            Updated: {new Date(rev.updated_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex sm:flex-col items-center gap-1.5 self-end sm:self-start flex-shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(rev)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                        title="Edit Review"
                      >
                        <Edit size={12} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 mt-3">No Reviews Found</h3>
              <p className="text-xs text-slate-400 mt-1">There are no reviews matching your filter criteria for this product.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 mt-3">Select a Product</h3>
          <p className="text-xs text-slate-400 mt-1">Please select a product from the list above to manage its reviews.</p>
        </div>
      )}

      {/* Update Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-500" />
                <span>Edit Review Details</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-start gap-2 animate-shake">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Reviewer Display */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reviewer</label>
                <div className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold font-mono truncate">
                  👤 {editingReview?.user?.email || editingReview?.user_id}
                </div>
              </div>

              {/* Rating Star Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Rating (1 to 5 Stars) *</label>
                <div className="flex items-center gap-2 text-slate-300">
                  {[1, 2, 3, 4, 5].map((starNum) => {
                    const isSelected = starNum <= formRating;
                    return (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() => setFormRating(starNum)}
                        className="p-1 hover:scale-115 transition-transform text-amber-400 hover:text-amber-500 cursor-pointer focus:outline-none"
                      >
                        <Star 
                          size={28} 
                          fill={isSelected ? 'currentColor' : 'none'} 
                          className={isSelected ? 'text-amber-400' : 'text-slate-350'}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2.5 text-xs font-bold text-slate-500">{formRating} of 5 Stars</span>
                </div>
              </div>

              {/* Review Comment Text */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Review Text *</label>
                <textarea
                  rows="4"
                  placeholder="Update review comments..."
                  className="w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none transition-all outline-none"
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  required
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formLoading && <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>}
                  <span>Save Review</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
