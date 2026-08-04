import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertCircle, 
  X, 
  Check, 
  Image as ImageIcon,
  Clock
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000') + '/api/usp-sections';
const SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const USPs = () => {
  const [usps, setUsps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'active' | 'inactive'
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsp, setEditingUsp] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [iconType, setIconType] = useState('emoji'); // 'emoji' | 'image'
  const [iconValue, setIconValue] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);
  
  // File upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Toast notification
  const [notification, setNotification] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchUSPs = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_BASE_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.status === 200 && data.success) {
        setUsps(data.usps || []);
      } else {
        setError(data.message || 'Failed to fetch USP sections.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUSPs();
  }, []);

  const handleOpenAddModal = () => {
    setEditingUsp(null);
    setTitle('');
    setDescription('');
    setIconType('emoji');
    setIconValue('');
    setDisplayOrder('1');
    setIsActive(true);
    setImageFile(null);
    setImagePreview(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (usp) => {
    setEditingUsp(usp);
    setTitle(usp.title);
    setDescription(usp.description);
    setIconType(usp.icon_type);
    
    if (usp.icon_type === 'emoji') {
      setIconValue(usp.icon_value);
      setImageFile(null);
      setImagePreview(null);
    } else {
      setIconValue(usp.icon_value);
      setImageFile(null);
      setImagePreview(usp.icon_value.startsWith('http') ? usp.icon_value : `${SERVER_URL}${usp.icon_value}`);
    }

    setDisplayOrder(usp.display_order.toString());
    setIsActive(usp.is_active);
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

    if (!title.trim() || !description.trim()) {
      setFormError('Please enter a title and description.');
      return;
    }

    if (iconType === 'emoji' && !iconValue.trim()) {
      setFormError('Emoji icon is required.');
      return;
    }

    if (iconType === 'image' && !imagePreview) {
      setFormError('Image icon is required.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('icon_type', iconType);
    formData.append('display_order', displayOrder);
    formData.append('is_active', isActive);

    if (iconType === 'emoji') {
      formData.append('icon_value', iconValue.trim());
    } else {
      if (imageFile) {
        formData.append('icon_value', imageFile);
      } else {
        // If updating but keeping the old image URL
        formData.append('icon_value', iconValue);
      }
    }

    try {
      const url = editingUsp ? `${API_BASE_URL}/${editingUsp.id}` : API_BASE_URL;
      const method = editingUsp ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
        body: formData
      });

      const data = await response.json();

      if (response.status === 200 || response.status === 201) {
        triggerToast(
          editingUsp ? 'USP section updated successfully.' : 'USP section created successfully.',
          'success'
        );
        fetchUSPs();
        setIsModalOpen(false);
      } else {
        setFormError(data.message || 'Failed to save USP section.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Network connection failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUsp = async (id) => {
    if (!window.confirm('Are you sure you want to delete this USP section?')) return;
    
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.status === 200 && data.success) {
        triggerToast('USP section deleted successfully.', 'success');
        setUsps(prev => prev.filter(item => item.id !== id));
      } else {
        triggerToast(data.message || 'Failed to delete USP section.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Connection failed.', 'error');
    }
  };

  const handleToggleActive = async (usp) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const nextActive = !usp.is_active;
      const response = await fetch(`${API_BASE_URL}/${usp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: nextActive })
      });
      const data = await response.json();

      if (response.status === 200 && data.success) {
        setUsps(prev => prev.map(item => item.id === usp.id ? { ...item, is_active: nextActive } : item));
        triggerToast(`USP section is now ${nextActive ? 'ACTIVE' : 'INACTIVE'}.`, 'success');
      } else {
        triggerToast(data.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Network error.', 'error');
    }
  };

  const filteredUSPs = usps.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'All' 
        ? true 
        : statusFilter === 'active' 
          ? item.is_active 
          : !item.is_active;

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
          <h2 className="text-xl font-bold text-slate-900">Why Shop with Us (USP Sections)</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage unique selling points displayed on the customer mobile app home screen.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/15 hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus size={16} />
          Create USP Section
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
                {status === 'All' ? 'All USPs' : status === 'active' ? 'Active' : 'Inactive'}
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
            onClick={fetchUSPs}
            className="px-3.5 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-55 cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Grid List View */}
      {loading ? (
        <div className="py-20 text-center">
          <span className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin inline-block"></span>
          <p className="text-xs text-slate-400 mt-3 font-semibold">Loading USP sections...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 max-w-lg mx-auto">
          <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-rose-900">Database Connection Error</h4>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
            <button onClick={fetchUSPs} className="text-xs font-bold text-rose-800 underline mt-2 hover:text-rose-900 cursor-pointer block">
              Try Again
            </button>
          </div>
        </div>
      ) : filteredUSPs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUSPs.map((usp) => {
            const isAbsolute = usp.icon_value && (usp.icon_value.startsWith('http://') || usp.icon_value.startsWith('https://'));
            const finalIconSrc = isAbsolute ? usp.icon_value : `${SERVER_URL}${usp.icon_value}`;

            return (
              <div key={usp.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                
                {/* Header Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-150 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                      {usp.icon_type === 'emoji' ? (
                        <span>{usp.icon_value}</span>
                      ) : (
                        <img src={finalIconSrc} alt="USP icon" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 leading-snug">{usp.title}</h3>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">Sort Order: {usp.display_order}</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(usp)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-55 rounded-lg transition-colors cursor-pointer"
                      title="Edit USP"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteUsp(usp.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-55 rounded-lg transition-colors cursor-pointer"
                      title="Delete USP"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-normal line-clamp-3">{usp.description}</p>

                {/* Footer Status and Toggle */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                    usp.is_active 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {usp.is_active ? 'Active' : 'Inactive'}
                  </span>

                  <button 
                    onClick={() => handleToggleActive(usp)}
                    className="px-3 py-1 border border-slate-200 hover:bg-slate-50 font-bold text-[9px] tracking-wide rounded-lg uppercase transition-all cursor-pointer text-slate-600"
                  >
                    {usp.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
          <Award className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 mt-3">No USP Sections Configured</h3>
          <p className="text-xs text-slate-400 mt-1">Create unique selling points (USP) highlight details to display on user home screens.</p>
        </div>
      )}

      {/* Creation / Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Award size={18} className="text-blue-500" />
                <span>{editingUsp ? 'Update USP Section' : 'Create USP Section'}</span>
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Superfast Delivery, Lowest Price Guaranteed..."
                  className="w-full rounded-xl border border-slate-255 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description *</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Your groceries are packed with care and delivered to your doorstep within 15 minutes..."
                  className="w-full rounded-xl border border-slate-255 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Icon Type and Display Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Icon Type *</label>
                  <select
                    className="w-full rounded-xl border border-slate-255 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-semibold"
                    value={iconType}
                    onChange={(e) => setIconType(e.target.value)}
                  >
                    <option value="emoji">Emoji Icon</option>
                    <option value="image">Image File / Upload</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-slate-255 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Dynamic Icon inputs */}
              {iconType === 'emoji' ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Emoji Icon (Paste 1 Emoji) *</label>
                  <input
                    type="text"
                    placeholder="e.g. 🚚 or 📦"
                    className="w-full rounded-xl border border-slate-255 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    value={iconValue}
                    onChange={(e) => setIconValue(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Icon Image Upload *</label>
                  <div className="space-y-3">
                    {imagePreview ? (
                      <div className="relative rounded-2xl overflow-hidden aspect-[16/7] border border-slate-205 bg-slate-50 flex items-center justify-center">
                        <img src={imagePreview} alt="Icon Preview" className="w-full h-full object-contain" />
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
                        <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">Upload Icon Logo/Image</span>
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
              )}

              {/* Status active */}
              <div className="flex items-center justify-between border-t border-slate-150 pt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase">USP Status (Active)</span>
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
                  <span>{editingUsp ? 'Save Changes' : 'Create USP'}</span>
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

export default USPs;
