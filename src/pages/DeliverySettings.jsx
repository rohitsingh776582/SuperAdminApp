import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Store, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Coins, 
  ShieldCheck, 
  Compass, 
  Sliders, 
  ArrowRight,
  X,
  HelpCircle
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api/delivery-settings';

export default function DeliverySettings() {
  // Global & Store States
  const [storesWithSettings, setStoresWithSettings] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form Configuration States for Selected Store
  const [isDistancePricingEnabled, setIsDistancePricingEnabled] = useState(false);
  const [pricingMethod, setPricingMethod] = useState('slabs'); // 'slabs' | 'per_km' | 'flat'
  const [slabs, setSlabs] = useState([]);
  const [baseDeliveryCharge, setBaseDeliveryCharge] = useState('20');
  const [perKmCharge, setPerKmCharge] = useState('10');
  const [minDeliveryCharge, setMinDeliveryCharge] = useState('10');
  const [maxDeliveryCharge, setMaxDeliveryCharge] = useState('');
  
  // Rules States
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(true);
  const [isFreeDeliveryEnabled, setIsFreeDeliveryEnabled] = useState(true);
  const [freeDeliveryMinAmount, setFreeDeliveryMinAmount] = useState('199');
  const [minimumOrderAmount, setMinimumOrderAmount] = useState('0');
  const [handlingCharge, setHandlingCharge] = useState('10');
  const [maxDeliveryDistanceKm, setMaxDeliveryDistanceKm] = useState('10');
  const [distanceMethod, setDistanceMethod] = useState('road');

  // Slab Editing Modal / Drawer State
  const [isSlabModalOpen, setIsSlabModalOpen] = useState(false);
  const [editingSlabIndex, setEditingSlabIndex] = useState(null);
  const [slabMinDist, setSlabMinDist] = useState('');
  const [slabMaxDist, setSlabMaxDist] = useState('');
  const [slabCharge, setSlabCharge] = useState('');
  const [slabFreeDeliveryEnabled, setSlabFreeDeliveryEnabled] = useState(false);
  const [slabFreeThreshold, setSlabFreeThreshold] = useState('');
  const [slabModalError, setSlabModalError] = useState(null);

  // Simulation Calculator State
  const [simDistance, setSimDistance] = useState('3.5');
  const [simSubtotal, setSimSubtotal] = useState('150');

  const triggerToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch all dark stores and their settings
  const fetchAllStoresAndSettings = async (targetStoreToSelect = null) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setError('Please sign in as administrator to manage delivery settings.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const list = data.settingsList || [];
        setStoresWithSettings(list);

        if (list.length > 0) {
          const storeToPick = targetStoreToSelect 
            ? list.find(s => s.store_id === targetStoreToSelect) || list[0]
            : (selectedStoreId ? list.find(s => s.store_id === selectedStoreId) || list[0] : list[0]);

          loadStoreSettingsIntoForm(storeToPick);
        } else {
          setError('No Dark Stores registered in the system.');
        }
      } else {
        setError(data.message || 'Failed to load delivery settings.');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Could not connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Populate form with the selected store's configuration
  const loadStoreSettingsIntoForm = (storeSetting) => {
    if (!storeSetting) return;

    setSelectedStoreId(storeSetting.store_id);
    setSelectedStore(storeSetting);

    setIsDistancePricingEnabled(storeSetting.is_distance_pricing_enabled === true);
    setPricingMethod(storeSetting.pricing_method || 'slabs');
    setSlabs(Array.isArray(storeSetting.slabs) ? storeSetting.slabs : []);
    
    setBaseDeliveryCharge(String(storeSetting.base_delivery_charge ?? storeSetting.delivery_charge ?? 20));
    setPerKmCharge(String(storeSetting.per_km_charge ?? 10));
    setMinDeliveryCharge(String(storeSetting.minimum_delivery_charge ?? 10));
    setMaxDeliveryCharge(storeSetting.maximum_delivery_charge !== null && storeSetting.maximum_delivery_charge !== undefined ? String(storeSetting.maximum_delivery_charge) : '');
    
    setIsDeliveryEnabled(storeSetting.is_delivery_enabled !== false);
    setIsFreeDeliveryEnabled(storeSetting.is_free_delivery_enabled !== false);
    setFreeDeliveryMinAmount(String(storeSetting.free_delivery_minimum_amount ?? 199));
    setMinimumOrderAmount(String(storeSetting.minimum_order_amount ?? 0));
    setHandlingCharge(String(storeSetting.handling_charge ?? 10));
    setMaxDeliveryDistanceKm(String(storeSetting.maximum_delivery_distance_km ?? 10));
    setDistanceMethod(storeSetting.distance_calculation_method || 'road');
  };

  useEffect(() => {
    fetchAllStoresAndSettings();
  }, []);

  const handleSelectStore = (storeId) => {
    const found = storesWithSettings.find(s => s.store_id === storeId);
    if (found) {
      loadStoreSettingsIntoForm(found);
    }
  };

  // Slab Modal Handlers
  const handleOpenAddSlab = () => {
    setEditingSlabIndex(null);
    // Suggest next contiguous starting distance
    let nextMin = '0';
    if (slabs.length > 0) {
      const maxVal = Math.max(...slabs.map(s => parseFloat(s.maximum_distance_km || 0)));
      nextMin = String(maxVal);
    }
    setSlabMinDist(nextMin);
    setSlabMaxDist(String(parseFloat(nextMin) + 3));
    setSlabCharge('20');
    setSlabFreeDeliveryEnabled(false);
    setSlabFreeThreshold('');
    setSlabModalError(null);
    setIsSlabModalOpen(true);
  };

  const handleOpenEditSlab = (index) => {
    setEditingSlabIndex(index);
    const target = slabs[index];
    setSlabMinDist(String(target.minimum_distance_km));
    setSlabMaxDist(String(target.maximum_distance_km));
    setSlabCharge(String(target.delivery_charge));
    setSlabFreeDeliveryEnabled(target.is_free_delivery_enabled === true);
    setSlabFreeThreshold(target.free_delivery_threshold ? String(target.free_delivery_threshold) : '');
    setSlabModalError(null);
    setIsSlabModalOpen(true);
  };

  const handleSaveSlab = () => {
    const min = parseFloat(slabMinDist);
    const max = parseFloat(slabMaxDist);
    const charge = parseFloat(slabCharge);

    if (isNaN(min) || min < 0) {
      setSlabModalError('Minimum distance must be a valid number >= 0.');
      return;
    }
    if (isNaN(max) || max <= min) {
      setSlabModalError('Maximum distance must be strictly greater than Minimum distance.');
      return;
    }
    if (isNaN(charge) || charge < 0) {
      setSlabModalError('Delivery charge must be a non-negative number.');
      return;
    }

    if (slabFreeDeliveryEnabled) {
      const threshold = parseFloat(slabFreeThreshold);
      if (isNaN(threshold) || threshold <= 0) {
        setSlabModalError('Free Delivery Threshold must be greater than ₹0 when Free Delivery is enabled.');
        return;
      }
    }

    const newSlab = {
      minimum_distance_km: min,
      maximum_distance_km: max,
      delivery_charge: charge,
      is_free_delivery_enabled: slabFreeDeliveryEnabled,
      free_delivery_threshold: slabFreeDeliveryEnabled ? parseFloat(slabFreeThreshold || 0) : 0
    };

    let updatedList = [];
    if (editingSlabIndex !== null) {
      updatedList = slabs.map((s, idx) => idx === editingSlabIndex ? newSlab : s);
    } else {
      updatedList = [...slabs, newSlab];
    }

    // Sort slabs sequentially by minimum distance
    updatedList.sort((a, b) => a.minimum_distance_km - b.minimum_distance_km);

    setSlabs(updatedList);
    setIsSlabModalOpen(false);
  };

  const handleDeleteSlab = (index) => {
    setSlabs(prev => prev.filter((_, idx) => idx !== index));
  };

  // Save Settings to Backend
  const handleSaveAllSettings = async (e) => {
    e.preventDefault();
    if (!selectedStoreId) {
      triggerToast('No Dark Store selected.', 'error');
      return;
    }

    const freeMin = parseFloat(freeDeliveryMinAmount || 0);
    const minOrder = parseFloat(minimumOrderAmount || 0);
    const handCharge = parseFloat(handlingCharge || 0);
    const baseCharge = parseFloat(baseDeliveryCharge || 0);
    const perKm = parseFloat(perKmCharge || 0);
    const minCharge = parseFloat(minDeliveryCharge || 0);
    const maxCharge = maxDeliveryCharge !== '' ? parseFloat(maxDeliveryCharge) : null;
    const maxDist = parseFloat(maxDeliveryDistanceKm || 10);

    if (isNaN(freeMin) || freeMin < 0 || isNaN(minOrder) || minOrder < 0 || isNaN(handCharge) || handCharge < 0) {
      triggerToast('All fee inputs must be non-negative numbers.', 'error');
      return;
    }
    if (isNaN(maxDist) || maxDist <= 0) {
      triggerToast('Maximum delivery distance must be > 0 km.', 'error');
      return;
    }

    if (isDistancePricingEnabled && pricingMethod === 'slabs' && slabs.length === 0) {
      triggerToast('Please configure at least one distance slab when slab pricing is enabled.', 'error');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('adminToken');

    try {
      const payload = {
        store_id: selectedStoreId,
        is_distance_pricing_enabled: isDistancePricingEnabled,
        pricing_method: pricingMethod,
        slabs: slabs,
        is_delivery_enabled: isDeliveryEnabled,
        is_free_delivery_enabled: isFreeDeliveryEnabled,
        free_delivery_minimum_amount: freeMin,
        minimum_order_amount: minOrder,
        handling_charge: handCharge,
        base_delivery_charge: baseCharge,
        per_km_charge: perKm,
        minimum_delivery_charge: minCharge,
        maximum_delivery_charge: maxCharge,
        maximum_delivery_distance_km: maxDist,
        distance_calculation_method: distanceMethod
      };

      const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        triggerToast(`Delivery settings saved successfully for "${selectedStore?.store_name || 'selected store'}"!`, 'success');
        await fetchAllStoresAndSettings(selectedStoreId);
      } else {
        triggerToast(data.message || 'Failed to save delivery settings.', 'error');
      }
    } catch (err) {
      console.error('Error saving delivery settings:', err);
      triggerToast('Network error while saving delivery settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Live Simulation Calculation for Admin Preview
  const calculateSimulatedCharge = () => {
    const dist = parseFloat(simDistance) || 0;
    const subtotal = parseFloat(simSubtotal) || 0;
    const maxDist = parseFloat(maxDeliveryDistanceKm) || 10;
    const minOrder = parseFloat(minimumOrderAmount) || 0;
    const freeMin = isFreeDeliveryEnabled ? parseFloat(freeDeliveryMinAmount) || 0 : 0;
    const handCharge = subtotal > 0 ? parseFloat(handlingCharge) || 0 : 0;

    if (!isDeliveryEnabled) {
      return { serviceable: false, reason: 'Delivery paused for this store', charge: 0, handling: handCharge, total: subtotal + handCharge };
    }
    if (dist > maxDist) {
      return { serviceable: false, reason: `Beyond maximum range (${maxDist} km)`, charge: 0, handling: handCharge, total: subtotal + handCharge };
    }
    if (subtotal < minOrder && minOrder > 0) {
      return { serviceable: false, reason: `Subtotal below min order (₹${minOrder})`, charge: 0, handling: handCharge, total: subtotal + handCharge };
    }

    let delCharge = 0;
    if (!isDistancePricingEnabled || pricingMethod === 'flat') {
      delCharge = parseFloat(baseDeliveryCharge) || 0;
    } else if (pricingMethod === 'per_km') {
      const base = parseFloat(baseDeliveryCharge) || 0;
      const rate = parseFloat(perKmCharge) || 0;
      const floor = parseFloat(minDeliveryCharge) || 0;
      const ceil = maxDeliveryCharge !== '' ? parseFloat(maxDeliveryCharge) : null;
      let calculated = base + (rate * dist);
      calculated = Math.max(calculated, floor);
      if (ceil !== null && ceil > 0) calculated = Math.min(calculated, ceil);
      delCharge = Math.round(calculated);
    } else if (pricingMethod === 'slabs') {
      let matched = false;
      let matchedSlabObj = null;
      const sorted = [...slabs].sort((a, b) => a.minimum_distance_km - b.minimum_distance_km);
      for (let i = 0; i < sorted.length; i++) {
        const s = sorted[i];
        if (i === 0 && dist >= s.minimum_distance_km && dist <= s.maximum_distance_km) {
          delCharge = parseFloat(s.delivery_charge);
          matchedSlabObj = s;
          matched = true;
          break;
        } else if (dist > s.minimum_distance_km && dist <= s.maximum_distance_km) {
          delCharge = parseFloat(s.delivery_charge);
          matchedSlabObj = s;
          matched = true;
          break;
        }
      }
      if (!matched && sorted.length > 0 && dist > sorted[sorted.length - 1].maximum_distance_km) {
        delCharge = parseFloat(sorted[sorted.length - 1].delivery_charge);
        matchedSlabObj = sorted[sorted.length - 1];
      } else if (!matched) {
        delCharge = parseFloat(baseDeliveryCharge) || 0;
      }

      // Per-slab free delivery check
      if (matchedSlabObj && matchedSlabObj.is_free_delivery_enabled === true) {
        const slabThreshold = parseFloat(matchedSlabObj.free_delivery_threshold || 0);
        if (slabThreshold > 0 && subtotal >= slabThreshold) {
          delCharge = 0;
        }
      } else if (isFreeDeliveryEnabled && freeMin > 0 && subtotal >= freeMin) {
        delCharge = 0;
      }
    }

    // For non-slab methods, apply store-wide free delivery
    if (pricingMethod !== 'slabs' || !isDistancePricingEnabled) {
      if (isFreeDeliveryEnabled && freeMin > 0 && subtotal >= freeMin) {
        delCharge = 0;
      }
    }

    return {
      serviceable: true,
      charge: Math.round(delCharge),
      handling: Math.round(handCharge),
      total: Math.round(subtotal + delCharge + handCharge)
    };
  };

  const simResult = calculateSimulatedCharge();

  if (loading && storesWithSettings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading delivery settings & Dark Stores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans relative pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-xl shadow-xl border text-sm font-semibold transition-all duration-300 transform translate-y-0 ${
          notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full mr-2.5 ${notification.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          {notification.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <Truck size={22} />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Delivery Charge Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure independent distance-based delivery charges, slabs, free delivery rules, and handling fees for each Dark Store.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAllStoresAndSettings(selectedStoreId)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Reload
          </button>
          <button
            onClick={handleSaveAllSettings}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Save size={15} />
            {saving ? 'Saving Settings...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm font-medium">
          <AlertCircle size={20} className="shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. DARK STORE SELECTOR SECTION */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Store size={18} className="text-blue-600" />
              Select Dark Store
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Each Dark Store operates with completely independent pricing rules. Changes to one store will not affect other stores.
            </p>
          </div>

          <div className="w-full md:w-80">
            <select
              value={selectedStoreId}
              onChange={(e) => handleSelectStore(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {storesWithSettings.map((s) => (
                <option key={s.store_id} value={s.store_id}>
                  {s.store_name} ({s.store_pin || 'PIN: N/A'}) • {s.is_distance_pricing_enabled ? 'Distance Pricing' : 'Flat Pricing'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Store Badge Details */}
        {selectedStore && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-1">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-150 dark:border-slate-700/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Store Name</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{selectedStore.store_name}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-150 dark:border-slate-700/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PIN Code</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedStore.store_pin || 'Not specified'}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-150 dark:border-slate-700/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operation Status</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${selectedStore.store_status === 'open' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="text-xs font-bold capitalize text-slate-700 dark:text-slate-300">{selectedStore.store_status || 'Open'}</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-150 dark:border-slate-700/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Pricing Method</span>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5 capitalize">
                {isDistancePricingEnabled ? (pricingMethod === 'slabs' ? 'Distance Slabs' : 'Per Kilometer') : 'Flat Base Rate'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: PRICING CONFIGURATION (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* PRICING TOGGLE & METHOD SELECTOR */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders size={18} className="text-indigo-600" />
                  Delivery Pricing System
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose whether this store charges by customer distance or a flat base charge.
                </p>
              </div>

              {/* Main Distance Pricing Toggle */}
              <label className="flex items-center cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isDistancePricingEnabled}
                    onChange={(e) => setIsDistancePricingEnabled(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${isDistancePricingEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isDistancePricingEnabled ? 'transform translate-x-5' : ''}`} />
                </div>
                <span className="ml-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isDistancePricingEnabled ? 'Distance Pricing Active' : 'Distance Pricing Disabled'}
                </span>
              </label>
            </div>

            {/* Pricing Method Selection Radio Pills */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2.5">
                Pricing Calculation Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPricingMethod('slabs')}
                  disabled={!isDistancePricingEnabled}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer disabled:opacity-40 ${
                    pricingMethod === 'slabs'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold">Method A: Distance Slabs</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">E.g., 0–2 km = ₹10, 2–5 km = ₹20</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPricingMethod('per_km')}
                  disabled={!isDistancePricingEnabled}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer disabled:opacity-40 ${
                    pricingMethod === 'per_km'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold">Method B: Per Kilometer</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Base charge + ₹/km rate</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPricingMethod('flat')}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    pricingMethod === 'flat' || !isDistancePricingEnabled
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold">Method C: Flat Store Charge</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Single fixed delivery fee</p>
                </button>
              </div>
            </div>

            {/* METHOD A: DISTANCE SLABS TABLE */}
            {isDistancePricingEnabled && pricingMethod === 'slabs' && (
              <div className="pt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Configured Distance Slabs
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Orders matching each distance bracket will incur the specified delivery fee.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddSlab}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
                  >
                    <Plus size={14} />
                    Add Distance Slab
                  </button>
                </div>

                {slabs.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No distance slabs defined yet</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5">
                      Click "Add Distance Slab" to define your store's first distance range (e.g. 0 to 2 km = ₹10).
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2.5 px-4">Slab #</th>
                          <th className="py-2.5 px-4">Distance Range</th>
                          <th className="py-2.5 px-4">Delivery Charge</th>
                          <th className="py-2.5 px-4">Free Delivery</th>
                          <th className="py-2.5 px-4">Min. Subtotal</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {slabs.map((slab, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                              Slab {idx + 1}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                                {idx === 0 ? `0 – ${slab.maximum_distance_km} km` : `Above ${slab.minimum_distance_km} – ${slab.maximum_distance_km} km`}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{slab.delivery_charge}
                            </td>
                            <td className="py-3 px-4">
                              {slab.is_free_delivery_enabled ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                                  <CheckCircle2 size={12} /> Enabled
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                                  Disabled
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                              {slab.is_free_delivery_enabled ? (
                                <span className="font-bold">₹{slab.free_delivery_threshold}</span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditSlab(idx)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg cursor-pointer"
                                title="Edit slab"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSlab(idx)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg cursor-pointer"
                                title="Delete slab"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* METHOD B: PER KILOMETER INPUTS */}
            {isDistancePricingEnabled && pricingMethod === 'per_km' && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Base Delivery Charge (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={baseDeliveryCharge}
                    onChange={(e) => setBaseDeliveryCharge(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                    placeholder="e.g. 15"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Starting charge for any order</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Rate Per Kilometer (₹/km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={perKmCharge}
                    onChange={(e) => setPerKmCharge(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                    placeholder="e.g. 8"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Fee added for each km of distance</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Minimum Delivery Charge Floor (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={minDeliveryCharge}
                    onChange={(e) => setMinDeliveryCharge(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                    placeholder="e.g. 10"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">The charge will never drop below this</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Maximum Delivery Charge Ceiling (₹) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={maxDeliveryCharge}
                    onChange={(e) => setMaxDeliveryCharge(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                    placeholder="e.g. 60 (leave blank for no limit)"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Upper cap for delivery fee</p>
                </div>
              </div>
            )}

            {/* METHOD C: FLAT PRICING INPUT */}
            {(!isDistancePricingEnabled || pricingMethod === 'flat') && (
              <div className="pt-2 max-w-sm">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Flat Delivery Charge (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={baseDeliveryCharge}
                  onChange={(e) => setBaseDeliveryCharge(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                  placeholder="e.g. 20"
                />
                <p className="text-[10px] text-slate-400 mt-1">Fixed fee charged to all customers regardless of distance.</p>
              </div>
            )}

          </div>

          {/* STORE DELIVERY RULES SECTION */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Coins size={18} className="text-emerald-600" />
                Store Delivery Rules & Thresholds
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage free delivery qualification, handling fees, and service boundaries.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Free Delivery Toggle and Min Amount */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Free Delivery Program
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFreeDeliveryEnabled}
                      onChange={(e) => setIsFreeDeliveryEnabled(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-9 h-5 rounded-full transition-colors ${isFreeDeliveryEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${isFreeDeliveryEnabled ? 'transform translate-x-4' : ''}`} />
                  </label>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Free Delivery Threshold (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    disabled={!isFreeDeliveryEnabled}
                    value={freeDeliveryMinAmount}
                    onChange={(e) => setFreeDeliveryMinAmount(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-100 disabled:opacity-40"
                    placeholder="e.g. 199"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Free delivery is granted when order subtotal meets or exceeds this amount.</p>
                </div>
              </div>

              {/* Handling Charge */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Platform Handling Charge (₹)
                </span>
                <div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={handlingCharge}
                    onChange={(e) => setHandlingCharge(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-100"
                    placeholder="e.g. 10"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Calculated separately; free delivery does NOT waive handling fees.</p>
                </div>
              </div>

              {/* Minimum Order Amount */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Minimum Order Amount (₹)
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={minimumOrderAmount}
                  onChange={(e) => setMinimumOrderAmount(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-100"
                  placeholder="e.g. 50 (0 for no minimum)"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Orders below this subtotal will be blocked at checkout.</p>
              </div>

              {/* Maximum Delivery Distance */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Maximum Serviceable Distance (km)
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={maxDeliveryDistanceKm}
                  onChange={(e) => setMaxDeliveryDistanceKm(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-slate-100"
                  placeholder="e.g. 10"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Customers beyond this radius cannot place orders.</p>
              </div>

            </div>

            {/* Store Delivery Enable / Pause Switch */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Store Delivery Service Active
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When turned OFF, all deliveries for this specific Dark Store will be temporarily paused.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDeliveryEnabled}
                  onChange={(e) => setIsDeliveryEnabled(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${isDeliveryEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`} />
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isDeliveryEnabled ? 'transform translate-x-5' : ''}`} />
              </label>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE SIMULATOR & POLICY SUMMARY (1 Col) */}
        <div className="space-y-6">

          {/* INTERACTIVE PRICE SIMULATOR CARD */}
          <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/80 dark:from-slate-900 dark:to-slate-900/90 p-5 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="text-indigo-600 dark:text-indigo-400" size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                Live Pricing Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test how current rules for <strong className="text-slate-700 dark:text-slate-200">{selectedStore?.store_name}</strong> will charge customers.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Customer Distance (km)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={simDistance}
                  onChange={(e) => setSimDistance(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Cart Subtotal (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={simSubtotal}
                  onChange={(e) => setSimSubtotal(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Simulation Result Box */}
            <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Calculated Customer Bill
              </span>

              {simResult.serviceable ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Cart Subtotal:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{parseFloat(simSubtotal || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Delivery Charge:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {simResult.charge === 0 ? 'FREE' : `₹${simResult.charge}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Handling Fee:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{simResult.handling}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-900 dark:text-white">Total Payable:</span>
                    <span className="font-black text-blue-600 dark:text-blue-400 text-base">₹{simResult.total}</span>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  ⚠️ Checkout Blocked: {simResult.reason}
                </div>
              )}
            </div>
          </div>

          {/* POLICY EXPLANATION CARD */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Info size={16} className="text-blue-500" />
              Delivery Policy Guidelines
            </h4>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside">
              <li>Distance is measured from the assigned Dark Store coordinates to customer address.</li>
              <li>Free delivery threshold evaluates merchandise subtotal after eligible coupon discounts.</li>
              <li>Slab boundaries (e.g. 0–2 km vs 2–5 km) are strictly evaluated on backend order validation.</li>
              <li>Customers beyond the store's max distance are blocked with an "out of range" message.</li>
            </ul>
          </div>

        </div>

      </div>

      {/* SLAB MODAL DIALOG */}
      {isSlabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingSlabIndex !== null ? `Edit Distance Slab #${editingSlabIndex + 1}` : 'Add Distance Slab'}
              </h3>
              <button
                onClick={() => setIsSlabModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {slabModalError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-medium">
                {slabModalError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Minimum Distance (km)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={slabMinDist}
                  onChange={(e) => setSlabMinDist(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  placeholder="e.g. 0"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Maximum Distance (km)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={slabMaxDist}
                  onChange={(e) => setSlabMaxDist(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  placeholder="e.g. 2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Delivery Charge (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={slabCharge}
                  onChange={(e) => setSlabCharge(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  placeholder="e.g. 15"
                />
              </div>

              {/* Per-Slab Free Delivery Configuration */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Free Delivery for This Slab
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slabFreeDeliveryEnabled}
                      onChange={(e) => setSlabFreeDeliveryEnabled(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-9 h-5 rounded-full transition-colors ${slabFreeDeliveryEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${slabFreeDeliveryEnabled ? 'transform translate-x-4' : ''}`} />
                  </label>
                </div>

                {slabFreeDeliveryEnabled && (
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 text-[11px]">
                      Minimum Eligible Subtotal (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={slabFreeThreshold}
                      onChange={(e) => setSlabFreeThreshold(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                      placeholder="e.g. 249"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Orders ≥ this subtotal get free delivery for this distance slab.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSlabModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSlab}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                Save Slab
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
