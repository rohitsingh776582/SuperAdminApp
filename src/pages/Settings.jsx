import React, { useState, useEffect } from 'react';
import { Save, Bell, Shield, Laptop, Mail, Key, Sliders } from 'lucide-react';

const Settings = () => {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  const [profile, setProfile] = useState({
    name: 'Rohit Sharma',
    email: 'rohit.admin@apnahome.com',
    role: 'Super Admin',
  });

  const [toggles, setToggles] = useState({
    autoApprove: false,
    emailOnListingSubmit: true,
    emailOnAgentRegister: true,
    weeklyReport: false,
  });

  // Global System and Upload Settings
  const [systemSettings, setSystemSettings] = useState({
    free_delivery_min_amount: '0',
    delivery_charge: '0',
    handling_charge: '0',
    max_image_size_kb: '5120'
  });

  const [notification, setNotification] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const triggerToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch Delivery & Image Settings on load
  const fetchSystemSettings = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch(`${BASE_URL}/api/delivery-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.settings) {
        setSystemSettings({
          free_delivery_min_amount: data.settings.free_delivery_min_amount.toString(),
          delivery_charge: data.settings.delivery_charge.toString(),
          handling_charge: data.settings.handling_charge.toString(),
          max_image_size_kb: (data.settings.max_image_size_kb || 5120).toString()
        });
      }
    } catch (err) {
      console.error('Error loading delivery/image settings:', err);
    }
  };

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const handleToggle = (key) => {
    setToggles(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    triggerToast('Profile settings saved successfully!');
  };

  // Save System & Upload Settings
  const handleSaveSystemSettings = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    if (!token) {
      triggerToast('Unauthorized. Token missing.', 'error');
      return;
    }

    setSettingsLoading(true);

    try {
      const payload = {
        free_delivery_min_amount: parseFloat(systemSettings.free_delivery_min_amount || 0),
        delivery_charge: parseFloat(systemSettings.delivery_charge || 0),
        handling_charge: parseFloat(systemSettings.handling_charge || 0),
        max_image_size_kb: parseInt(systemSettings.max_image_size_kb || 5120, 10),
        is_active: true
      };

      const response = await fetch(`${BASE_URL}/api/delivery-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.status === 200 && data.success) {
        triggerToast('System & Upload settings saved successfully!');
        if (data.settings) {
          setSystemSettings({
            free_delivery_min_amount: data.settings.free_delivery_min_amount.toString(),
            delivery_charge: data.settings.delivery_charge.toString(),
            handling_charge: data.settings.handling_charge.toString(),
            max_image_size_kb: (data.settings.max_image_size_kb || 5120).toString()
          });
        }
      } else {
        triggerToast(data.message || 'Failed to save system settings.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Network error while saving system settings.', 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
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
      <div>
        <h2 className="text-xl font-bold text-slate-900">Portal Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">Customize portal notification routes, security protocols, and general configurations.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: General Profile & Global System Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Laptop className="w-4.5 h-4.5 text-slate-400" />
                <span>Admin Profile Settings</span>
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-5">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Admin User"
                  className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-100"
                />
                <div>
                  <button type="button" className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-lg text-slate-600 transition-colors">
                    Change Picture
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1">JPG or PNG. Max size 1MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full py-2 px-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full py-2 px-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Role Type</label>
                  <input
                    type="text"
                    value={profile.role}
                    disabled
                    className="w-full py-2 px-3 text-sm text-slate-400 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
              <button 
                type="submit"
                className="inline-flex items-center space-x-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>

          {/* NEW: Global System & Image Upload Settings Form */}
          <form onSubmit={handleSaveSystemSettings} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Sliders className="w-4.5 h-4.5 text-slate-400" />
                <span>Global System & Upload Settings</span>
              </h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Free Delivery Min Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={systemSettings.free_delivery_min_amount}
                  onChange={(e) => setSystemSettings({ ...systemSettings, free_delivery_min_amount: e.target.value })}
                  className="w-full py-2 px-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Standard Delivery Charge (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={systemSettings.delivery_charge}
                  onChange={(e) => setSystemSettings({ ...systemSettings, delivery_charge: e.target.value })}
                  className="w-full py-2 px-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Handling Charge (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={systemSettings.handling_charge}
                  onChange={(e) => setSystemSettings({ ...systemSettings, handling_charge: e.target.value })}
                  className="w-full py-2 px-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Max Image Upload Limit (KB)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 30 for 30KB, 5120 for 5MB"
                  value={systemSettings.max_image_size_kb}
                  onChange={(e) => setSystemSettings({ ...systemSettings, max_image_size_kb: e.target.value })}
                  className="w-full py-2 px-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Specify the size in KB. Setting "30" means 30 KB.</span>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
              <button 
                type="submit"
                disabled={settingsLoading}
                className="inline-flex items-center space-x-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-lg shadow-blue-500/10 transition-all disabled:opacity-70 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{settingsLoading ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>

          {/* Security Panel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Key className="w-4.5 h-4.5 text-slate-400" />
                <span>Account Security</span>
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-bold text-slate-700">Update Password</div>
                  <div className="text-xs text-slate-400 mt-0.5">Revoke security sessions and update keys</div>
                </div>
                <button className="py-2 px-3.5 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-xl text-slate-600 transition-all cursor-pointer">
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Configuration Switch Controls */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Bell className="w-4.5 h-4.5 text-slate-400" />
              <span>Portal Notifications</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="max-w-[80%]">
                  <div className="text-xs font-bold text-slate-700">Auto-Approve Listings</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Automatically list submitted properties without manual verification (Not recommended).</div>
                </div>
                <button
                  onClick={() => handleToggle('autoApprove')}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center cursor-pointer ${
                    toggles.autoApprove ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform transform ${
                    toggles.autoApprove ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-start justify-between border-t border-slate-100 pt-4">
                <div className="max-w-[80%]">
                  <div className="text-xs font-bold text-slate-700">Listing Submission Alerts</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Receive email notification when an agent registers a new property.</div>
                </div>
                <button
                  onClick={() => handleToggle('emailOnListingSubmit')}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center cursor-pointer ${
                    toggles.emailOnListingSubmit ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform transform ${
                    toggles.emailOnListingSubmit ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-start justify-between border-t border-slate-100 pt-4">
                <div className="max-w-[80%]">
                  <div className="text-xs font-bold text-slate-700">Agent Registration Alerts</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Get notified immediately when a new agent requests dashboard credentials.</div>
                </div>
                <button
                  onClick={() => handleToggle('emailOnAgentRegister')}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center cursor-pointer ${
                    toggles.emailOnAgentRegister ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform transform ${
                    toggles.emailOnAgentRegister ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-start justify-between border-t border-slate-100 pt-4">
                <div className="max-w-[80%]">
                  <div className="text-xs font-bold text-slate-700">Weekly Summary Reports</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Generate weekly automated PDF reports of analytics, agent listings, and user growths.</div>
                </div>
                <button
                  onClick={() => handleToggle('weeklyReport')}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center cursor-pointer ${
                    toggles.weeklyReport ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform transform ${
                    toggles.weeklyReport ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Shield className="w-4.5 h-4.5 text-slate-400" />
              <span>Platform Verification</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verify platform license metrics, manage token registries, and control API interfaces for integrations.
            </p>
            <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              License ID: APNA-SUPER-ADMIN-2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
