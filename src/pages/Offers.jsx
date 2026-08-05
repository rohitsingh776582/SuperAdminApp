import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Calendar, 
  Percent, 
  Coins, 
  Clock, 
  RefreshCw 
} from 'lucide-react';
import OfferFormModal from '../components/OfferFormModal';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000') + '/api/offers';
const ADMIN_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000') + '/api/admin';

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'active' | 'inactive' | 'expired'

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Toast notification
  const [notification, setNotification] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchOffers = async () => {
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
        setOffers(data.offers || []);
      } else {
        setError(data.message || 'Failed to fetch offers/coupons.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingOffer(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (offer) => {
    setEditingOffer(offer);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveOffer = async (offerData) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setFormLoading(true);
    setFormError(null);

    try {
      const url = editingOffer ? `${API_BASE_URL}/${editingOffer.id}` : API_BASE_URL;
      const method = editingOffer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(offerData)
      });

      const data = await response.json();

      if (response.status === 200 || response.status === 201) {
        triggerToast(
          editingOffer ? 'Coupon updated successfully.' : 'Coupon created successfully.',
          'success'
        );
        fetchOffers();
        setIsModalOpen(false);
      } else {
        setFormError(data.message || 'Failed to save coupon.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Network connection failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotional coupon?')) return;
    
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.status === 200 && data.success) {
        triggerToast('Coupon deleted successfully.', 'success');
        setOffers(prev => prev.filter(o => o.id !== id));
      } else {
        triggerToast(data.message || 'Failed to delete coupon.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Connection failed.', 'error');
    }
  };

  // Toggle active status directly
  const handleToggleActive = async (offer) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const nextActive = !offer.is_active;
      const response = await fetch(`${API_BASE_URL}/${offer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: nextActive })
      });
      const data = await response.json();

      if (response.status === 200 && data.success) {
        setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, is_active: nextActive } : o));
        triggerToast(`Coupon is now ${nextActive ? 'ACTIVE' : 'INACTIVE'}.`, 'success');
      } else {
        triggerToast(data.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Network error.', 'error');
    }
  };

  const filteredOffers = offers.filter(o => {
    // 1. Search text filter
    const matchesSearch = 
      o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.description && o.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // 2. Status filter
    const now = new Date();
    const isExpired = new Date(o.end_date) < now;
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = o.is_active && !isExpired;
    } else if (statusFilter === 'inactive') {
      matchesStatus = !o.is_active;
    } else if (statusFilter === 'expired') {
      matchesStatus = isExpired;
    }

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
          <h2 className="text-xl font-bold text-slate-900">Offers & Coupons Hub</h2>
          <p className="text-xs text-slate-400 mt-0.5">Configure discounts, limit coupon usages, and assign store-specific deals.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/15 hover:shadow-lg transition-all cursor-pointer animate-fade-in"
        >
          <Plus size={16} />
          Create Coupon
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
          {['All', 'active', 'inactive', 'expired'].map((status) => {
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
                {status === 'All' ? 'All Coupons' : status === 'active' ? 'Active' : status === 'inactive' ? 'Inactive' : 'Expired'}
              </button>
            );
          })}
        </div>

        {/* Search controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search by code, title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-60 py-2 pl-9 pr-4 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
            />
          </div>
          
          <button 
            onClick={fetchOffers}
            className="px-3.5 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
            title="Refresh list"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Grid list view */}
      {loading ? (
        <div className="py-20 text-center">
          <span className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin inline-block"></span>
          <p className="text-xs text-slate-400 mt-3 font-semibold">Loading promo codes...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 max-w-lg mx-auto animate-fade-in">
          <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-rose-900">Database Connection Error</h4>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
            <button onClick={fetchOffers} className="text-xs font-bold text-rose-800 underline mt-2 hover:text-rose-900 cursor-pointer block">
              Try Again
            </button>
          </div>
        </div>
      ) : filteredOffers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredOffers.map((offer) => {
            const now = new Date();
            const isExpired = new Date(offer.end_date) < now;

            return (
              <div 
                key={offer.id} 
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Coupon Header Graphic Style */}
                <div className={`p-5 relative flex items-center justify-between border-b border-dashed border-slate-150 bg-gradient-to-tr ${
                  !offer.is_active 
                    ? 'from-slate-100 to-slate-200 text-slate-700' 
                    : isExpired 
                      ? 'from-rose-500/10 to-rose-650/5 text-rose-800' 
                      : 'from-blue-600/10 to-indigo-650/5 text-blue-900'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 font-mono text-sm font-black tracking-wider rounded-xl border border-dashed uppercase ${
                        !offer.is_active
                          ? 'bg-slate-200 border-slate-350 text-slate-500'
                          : isExpired
                            ? 'bg-rose-50 border-rose-300 text-rose-600'
                            : 'bg-blue-50 border-blue-300 text-blue-700'
                      }`}>
                        {offer.code}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold flex items-center gap-1">
                      {offer.discount_type === 'percentage' ? (
                        <>
                          <Percent size={12} className="text-blue-500" />
                          <span>Percentage Discount</span>
                        </>
                      ) : (
                        <>
                          <Coins size={12} className="text-emerald-500" />
                          <span>Flat Discount</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Discount Badge */}
                  <div className="text-right">
                    <span className={`text-2xl font-black ${
                      !offer.is_active 
                        ? 'text-slate-500' 
                        : isExpired 
                          ? 'text-rose-500' 
                          : 'text-blue-600'
                    }`}>
                      {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `₹${offer.discount_value}`}
                    </span>
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">OFF</p>
                  </div>

                  {/* Ribbon status indicator */}
                  <div className="absolute top-0 right-0 p-1">
                    <span className={`px-2 py-0.5 rounded-bl-xl text-[9px] font-extrabold uppercase text-white ${
                      !offer.is_active 
                        ? 'bg-slate-400' 
                        : isExpired 
                          ? 'bg-rose-500' 
                          : 'bg-emerald-500'
                    }`}>
                      {!offer.is_active ? 'Disabled' : isExpired ? 'Expired' : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Offer Details Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-indigo-650 bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                        🎟️ Coupon Offer
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 leading-snug">{offer.title}</h3>
                    {offer.description && (
                      <p className="text-xs text-slate-400 leading-normal line-clamp-2">{offer.description}</p>
                    )}
                  </div>

                  {/* Minimum / Maximum caps */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold p-2.5 bg-slate-50 rounded-xl border border-slate-150">
                    <div>
                      <span className="text-slate-400">Min. Order:</span>
                      <p className="text-slate-700 font-bold">₹{offer.min_order_amount}</p>
                    </div>
                    {offer.discount_type === 'percentage' && (
                      <div>
                        <span className="text-slate-400">Max Discount:</span>
                        <p className="text-slate-700 font-bold">
                          {offer.max_discount_amount ? `₹${offer.max_discount_amount}` : 'No Limit'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Dates validity */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Calendar size={12} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        Start: {new Date(offer.start_date).toLocaleDateString()} {new Date(offer.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Clock size={12} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        Expiry: {new Date(offer.end_date).toLocaleDateString()} {new Date(offer.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Operation Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleToggleActive(offer)}
                      className={`flex-1 py-1.5 border font-bold text-[10px] tracking-wide rounded-xl uppercase transition-all cursor-pointer ${
                        offer.is_active
                          ? 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          : 'border-blue-200 text-blue-600 hover:bg-blue-50/50 bg-blue-50/10'
                      }`}
                    >
                      {offer.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(offer)}
                      className="p-2 border border-slate-200 text-slate-600 hover:text-indigo-650 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit settings"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="p-2 border border-slate-200 text-slate-600 hover:text-rose-650 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete coupon"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center bg-white border border-dashed border-slate-200 rounded-3xl animate-fade-in">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 mt-3">No Offers Configured</h3>
          <p className="text-xs text-slate-400 mt-1">Add discount coupons to boost user transactions on Apna Home client devices.</p>
        </div>
      )}

      {/* Creation / Update Modal Component */}
      <OfferFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveOffer}
        editingOffer={editingOffer}
        formLoading={formLoading}
        formError={formError}
        setFormError={setFormError}
      />
    </div>
  );
};

export default Offers;
