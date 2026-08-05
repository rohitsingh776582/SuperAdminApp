import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Coins, 
  Settings, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Plus, 
  RefreshCw 
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000') + '/api/delivery-settings';

const DeliverySettings = () => {
  const [settingsList, setSettingsList] = useState([]);
  const [activeSettings, setActiveSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSettings, setEditingSettings] = useState(null);
  const [freeDeliveryMinAmount, setFreeDeliveryMinAmount] = useState('0');
  const [deliveryCharge, setDeliveryCharge] = useState('0');
  const [handlingCharge, setHandlingCharge] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Toast notification
  const [notification, setNotification] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchActiveSettings = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.status === 200 && data.success) {
        setActiveSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load active delivery settings:', err);
    }
  };

  const fetchAllSettings = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.status === 200 && data.success) {
        setSettingsList(data.settingsList || []);
      } else {
        setError(data.message || 'Failed to fetch delivery settings configuration.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSettings();
    fetchAllSettings();
  }, []);

  const handleOpenAddModal = () => {
    setEditingSettings(null);
    setFreeDeliveryMinAmount('0');
    setDeliveryCharge('0');
    setHandlingCharge('0');
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (settings) => {
    setEditingSettings(settings);
    setFreeDeliveryMinAmount(settings.free_delivery_min_amount.toString());
    setDeliveryCharge(settings.delivery_charge.toString());
    setHandlingCharge(settings.handling_charge.toString());
    setIsActive(settings.is_active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const minAmountNum = parseFloat(freeDeliveryMinAmount);
    const delChargeNum = parseFloat(deliveryCharge);
    const handChargeNum = parseFloat(handlingCharge);

    if (isNaN(minAmountNum) || minAmountNum < 0 || isNaN(delChargeNum) || delChargeNum < 0 || isNaN(handChargeNum) || handChargeNum < 0) {
      setFormError('All monetary values must be non-negative numbers.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    const body = {
      free_delivery_min_amount: minAmountNum,
      delivery_charge: delChargeNum,
      handling_charge: handChargeNum,
      is_active: isActive
    };

    try {
      const url = editingSettings ? `${API_BASE_URL}/${editingSettings.id}` : API_BASE_URL;
      const method = editingSettings ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.status === 200 || response.status === 201) {
        triggerToast(
          editingSettings ? 'Configuration updated successfully.' : 'Configuration created successfully.',
          'success'
        );
        fetchActiveSettings();
        fetchAllSettings();
        setIsModalOpen(false);
      } else {
        setFormError(data.message || 'Failed to save configuration.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Network connection failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSettings = async (id) => {
    if (!window.confirm('Are you sure you want to delete this delivery settings configuration?')) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.status === 200 && data.success) {
        triggerToast('Configuration deleted successfully.', 'success');
        setSettingsList(prev => prev.filter(s => s.id !== id));
        if (activeSettings && activeSettings.id === id) {
          setActiveSettings(null);
        }
      } else {
        triggerToast(data.message || 'Failed to delete configuration.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Connection failed.', 'error');
    }
  };

  const handleToggleActive = async (settings) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const nextActive = !settings.is_active;
      const response = await fetch(`${API_BASE_URL}/${settings.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: nextActive })
      });
      const data = await response.json();

      if (response.status === 200 && data.success) {
        triggerToast(`Configuration is now ${nextActive ? 'ACTIVE' : 'INACTIVE'}.`, 'success');
        fetchActiveSettings();
        fetchAllSettings();
      } else {
        triggerToast(data.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Network error.', 'error');
    }
  };

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
          <h2 className="text-xl font-bold text-slate-900">Delivery & Handling Settings</h2>
          <p className="text-xs text-slate-400 mt-0.5">Configure handling fees, delivery thresholds, and delivery rates.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/15 hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus size={16} />
          Add Configuration
        </button>
      </div>

      {/* Quick Active Settings card */}
      {activeSettings && (
        <div className="bg-gradient-to-tr from-blue-600 to-indigo-650 rounded-3xl p-6 text-white shadow-lg border border-blue-500/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-blue-100 flex items-center gap-1.5">
              <Truck size={16} />
              <span>Current Active Configuration</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-extrabold uppercase">
              Live
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 p-4 rounded-2xl border border-white/5">
              <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Free Delivery Min. Amount</span>
              <p className="text-xl font-black mt-1">₹{parseFloat(activeSettings.free_delivery_min_amount).toFixed(2)}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/5">
              <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Default Delivery Charge</span>
              <p className="text-xl font-black mt-1">₹{parseFloat(activeSettings.delivery_charge).toFixed(2)}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/5">
              <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Handling Fee</span>
              <p className="text-xl font-black mt-1">₹{parseFloat(activeSettings.handling_charge).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Configurations Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">All Configurations</h3>
          <button 
            onClick={() => { fetchActiveSettings(); fetchAllSettings(); }}
            className="p-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center gap-1"
            title="Refresh configurations"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <span className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin inline-block"></span>
            <p className="text-xs text-slate-400 mt-3 font-semibold">Loading delivery configurations...</p>
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 max-w-lg mx-auto my-6 animate-fade-in">
            <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-sm font-bold text-rose-900">Database Connection Error</h4>
              <p className="text-xs text-rose-700 mt-1">{error}</p>
            </div>
          </div>
        ) : settingsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Free Min Amount</th>
                  <th className="px-6 py-3">Delivery Fee</th>
                  <th className="px-6 py-3">Handling Fee</th>
                  <th className="px-6 py-3">Created At</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {settingsList.map((settings) => (
                  <tr key={settings.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(settings)}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                          settings.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {settings.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      ₹{parseFloat(settings.free_delivery_min_amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      ₹{parseFloat(settings.delivery_charge).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      ₹{parseFloat(settings.handling_charge).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(settings.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(settings)}
                        className="p-1.5 border border-slate-200 text-slate-500 hover:text-indigo-650 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Settings"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteSettings(settings.id)}
                        className="p-1.5 border border-slate-200 text-slate-500 hover:text-rose-650 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Configuration"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center bg-white border-t border-slate-100 animate-fade-in">
            <Truck className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 mt-3">No Configuration Found</h3>
            <p className="text-xs text-slate-400 mt-1">Configure pricing values to control handling and delivery charges globally.</p>
          </div>
        )}
      </div>

      {/* Creation / Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-md flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Settings size={18} className="text-blue-500" />
                <span>{editingSettings ? 'Edit Configuration' : 'Create Configuration'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Free Delivery Threshold */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Free Delivery Min. Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 199.00"
                  className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-bold"
                  value={freeDeliveryMinAmount}
                  onChange={(e) => setFreeDeliveryMinAmount(e.target.value)}
                  required
                />
              </div>

              {/* Delivery Charge */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Default Delivery Charge (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 29.00"
                  className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-bold"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  required
                />
              </div>

              {/* Handling Charge */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Handling Charge (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 5.00"
                  className="w-full rounded-xl border border-slate-250 bg-transparent px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-bold"
                  value={handlingCharge}
                  onChange={(e) => setHandlingCharge(e.target.value)}
                  required
                />
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between border-t border-slate-150 pt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Configuration Status (Active)</span>
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
                  <span>{editingSettings ? 'Save Changes' : 'Create Configuration'}</span>
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

export default DeliverySettings;
