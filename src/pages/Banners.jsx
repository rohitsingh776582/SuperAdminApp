import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Calendar, 
  Link as LinkIcon, 
  Layers, 
  ArrowUpDown, 
  Check, 
  X, 
  Clock, 
  ExternalLink 
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000') + '/api/promo-banners';
const SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'active' | 'inactive'
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [redirectType, setRedirectType] = useState('home');
  const [redirectId, setRedirectId] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Toast notification
  const [notification, setNotification] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchBanners = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.status === 200 && data.success) {
        setBanners(data.banners || []);
      } else {
        setError(data.message || 'Failed to fetch promo banners.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenAddModal = () => {
    setEditingBanner(null);
    setTitle('');
    setDescription('');
    setRedirectType('home');
    setRedirectId('');
    setExternalUrl('');
    setDisplayOrder('1');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setImageFile(null);
    setImagePreview(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setDescription(banner.description || '');
    setRedirectType(banner.redirect_type);
    setRedirectId(banner.redirect_id || '');
    setExternalUrl(banner.external_url || '');
    setDisplayOrder(banner.display_order.toString());
    setStartDate(banner.start_date ? banner.start_date.substring(0, 16) : '');
    setEndDate(banner.end_date ? banner.end_date.substring(0, 16) : '');
    setIsActive(banner.is_active);
    setImageFile(null);
    setImagePreview(banner.image_url.startsWith('http') ? banner.image_url : `${SERVER_URL}${banner.image_url}`);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    if (!title.trim() || !redirectType) {
      setFormError('Please enter a banner title and select a redirect type.');
      return;
    }

    if (!editingBanner && !imageFile) {
      setFormError('Banner image is required for new banners.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('redirect_type', redirectType);
    formData.append('redirect_id', redirectId.trim());
    formData.append('external_url', externalUrl.trim());
    formData.append('display_order', displayOrder);
    formData.append('is_active', isActive);

    if (startDate) {
      formData.append('start_date', new Date(startDate).toISOString());
    }
    if (endDate) {
      formData.append('end_date', new Date(endDate).toISOString());
    }

    if (imageFile) {
      formData.append('image_url', imageFile);
    }

    try {
      const url = editingBanner ? `${API_BASE_URL}/${editingBanner.id}` : API_BASE_URL;
      const method = editingBanner ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (response.status === 200 || response.status === 201) {
        triggerToast(
          editingBanner ? 'Promo banner updated successfully.' : 'Promo banner created successfully.',
          'success'
        );
        fetchBanners();
        setIsModalOpen(false);
      } else {
        setFormError(data.message || 'Failed to save banner.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Network connection failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotional banner?')) return;
    
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.status === 200 && data.success) {
        triggerToast('Promo banner deleted successfully.', 'success');
        setBanners(prev => prev.filter(b => b.id !== id));
      } else {
        triggerToast(data.message || 'Failed to delete banner.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Connection failed.', 'error');
    }
  };

  // Toggle active status directly
  const handleToggleActive = async (banner) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const nextActive = !banner.is_active;
      const response = await fetch(`${API_BASE_URL}/${banner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: nextActive })
      });
      const data = await response.json();

      if (response.status === 200 && data.success) {
        setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: nextActive } : b));
        triggerToast(`Banner is now ${nextActive ? 'ACTIVE' : 'INACTIVE'}.`, 'success');
      } else {
        triggerToast(data.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Network error.', 'error');
    }
  };

  const filteredBanners = banners.filter(b => {
    const matchesSearch = 
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'All' 
        ? true 
        : statusFilter === 'active' 
          ? b.is_active 
          : !b.is_active;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 transform translate-y-0 ${
          notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full mr-2.5 ${notification.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          {notification.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Promo Banners Hub</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage home slider graphics, external marketing redirects, and product banners.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/15 hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus size={16} />
          Create Banner
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        {/* Status filters */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl self-start md:self-auto">
          {['All', 'active', 'inactive'].map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status === 'All' ? 'All Banners' : status === 'active' ? 'Active' : 'Inactive'}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search by title, desc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 py-2 pl-9 pr-4 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
            />
          </div>
          <button 
            onClick={fetchBanners}
            className="px-3.5 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Grid List View */}
      {loading ? (
        <div className="py-20 text-center">
          <span className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin inline-block"></span>
          <p className="text-xs text-slate-400 mt-3 font-semibold">Loading promotional banners...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 max-w-lg mx-auto">
          <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-rose-900">Database Connection Error</h4>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
            <button onClick={fetchBanners} className="text-xs font-bold text-rose-800 underline mt-2 hover:text-rose-900 cursor-pointer block">
              Try Again
            </button>
          </div>
        </div>
      ) : filteredBanners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((banner) => {
            const finalImg = banner.image_url.startsWith('http') ? banner.image_url : `${SERVER_URL}${banner.image_url}`;
            return (
              <div key={banner.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                
                {/* Graphic Preview */}
                <div className="relative aspect-[16/8] bg-slate-100 overflow-hidden group">
                  <img src={finalImg} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  
                  {/* Operations overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(banner)}
                      className="p-2 bg-white/95 text-slate-600 hover:text-blue-600 rounded-xl shadow-md transition-colors cursor-pointer"
                      title="Edit Banner"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="p-2 bg-white/95 text-slate-600 hover:text-rose-600 rounded-xl shadow-md transition-colors cursor-pointer"
                      title="Delete Banner"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <span className={`absolute bottom-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm border ${
                    banner.is_active 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {banner.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">Sort Order: {banner.display_order}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-150 uppercase tracking-wide">
                        {banner.redirect_type}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 leading-snug">{banner.title}</h3>
                    {banner.description && (
                      <p className="text-xs text-slate-400 leading-normal line-clamp-2">{banner.description}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                    {/* Date Limit info */}
                    {(banner.start_date || banner.end_date) && (
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <Clock size={12} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">
                          {banner.start_date ? new Date(banner.start_date).toLocaleDateString() : 'Always'} - {banner.end_date ? new Date(banner.end_date).toLocaleDateString() : 'Forever'}
                        </span>
                      </div>
                    )}
                    
                    {/* Redirect settings */}
                    {banner.redirect_type !== 'home' && (
                      <div className="flex items-center gap-1.5 text-[10px] text-blue-600 bg-blue-50/50 p-1.5 rounded-lg border border-blue-100/40">
                        <LinkIcon size={12} className="flex-shrink-0" />
                        <span className="truncate font-semibold font-mono">
                          {banner.redirect_type === 'external_link' ? banner.external_url : banner.redirect_id}
                        </span>
                      </div>
                    )}

                    {/* Toggle action button */}
                    <button 
                      onClick={() => handleToggleActive(banner)}
                      className="w-full mt-2 py-1.5 border border-slate-200 hover:bg-slate-50 font-bold text-[10px] tracking-wide rounded-xl uppercase transition-all cursor-pointer"
                    >
                      {banner.is_active ? 'Set Inactive' : 'Set Active'}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 mt-3">No Banners Configured</h3>
          <p className="text-xs text-slate-400 mt-1">Add banners to highlight promotional deals or categories on user devices.</p>
        </div>
      )}

      {/* Creation / Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon size={18} className="text-blue-500" />
                <span>{editingBanner ? 'Update Promo Banner' : 'Create Promo Banner'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1 custom-scrollbar">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Banner Title *</label>
                <input
                  type="text"
                  placeholder="e.g. 50% Off on Fresh Fruits, Super Sunday Sale..."
                  className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Additional details about the promotion..."
                  className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Redirect Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Redirect Type *</label>
                  <select
                    className="w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-semibold"
                    value={redirectType}
                    onChange={(e) => setRedirectType(e.target.value)}
                  >
                    <option value="home">Home Screen</option>
                    <option value="category">Category</option>
                    <option value="product">Product Details</option>
                    <option value="offer">Offer/Coupon</option>
                    <option value="external_link">External Website</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Dynamic Redirect targets */}
              {redirectType !== 'home' && redirectType !== 'external_link' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Resource ID (UUID) *</label>
                  <input
                    type="text"
                    placeholder="Enter target category, product, or offer UUID..."
                    className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-mono"
                    value={redirectId}
                    onChange={(e) => setRedirectId(e.target.value)}
                    required
                  />
                </div>
              )}

              {redirectType === 'external_link' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">External Target URL *</label>
                  <input
                    type="url"
                    placeholder="https://example.com/promo-target..."
                    className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Validity Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date/Time</label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">End Date/Time</label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Image Graphic Upload */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Banner Graphic *</label>
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative rounded-2xl overflow-hidden aspect-[16/7] border border-slate-200 bg-slate-50">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-650 transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-250 rounded-2xl py-6 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                      <ImageIcon size={24} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">Upload Graphic</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Status active */}
              <div className="flex items-center justify-between border-t border-slate-150 pt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Banner Status (Active)</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center cursor-pointer ${
                    isActive ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform transform ${
                    isActive ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {formLoading && <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>}
                  <span>{editingBanner ? 'Save Changes' : 'Create Banner'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-150 hover:bg-slate-250 text-slate-700 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer"
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

export default Banners;
