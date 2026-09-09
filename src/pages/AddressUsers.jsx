import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Users,
  Search,
  RefreshCw,
  Building,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Store,
  Compass,
  FileText,
  Layers,
  Map,
  X
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';

const getGoogleMapsUrl = (locOrUser) => {
  if (!locOrUser) return '';
  const lat = locOrUser.latitude || locOrUser.lat;
  const lng = locOrUser.longitude || locOrUser.lng || locOrUser.long;

  if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const parts = [];
  if (locOrUser.house_no) parts.push(locOrUser.house_no);
  if (locOrUser.address_line || locOrUser.area_name || locOrUser.display_title) {
    parts.push(locOrUser.address_line || locOrUser.area_name || locOrUser.display_title);
  }
  if (locOrUser.landmark) parts.push(`Near ${locOrUser.landmark}`);
  if (locOrUser.city && locOrUser.city !== 'Not Set') parts.push(locOrUser.city);
  if (locOrUser.state && locOrUser.state !== 'Not Set') parts.push(locOrUser.state);
  parts.push('India');
  if (locOrUser.pin_code && locOrUser.pin_code !== 'Pending' && locOrUser.pin_code !== 'Not Set') {
    parts.push(locOrUser.pin_code);
  }

  const query = parts.filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

export default function AddressUsers() {
  // Stats
  const [stats, setStats] = useState(null);
  
  // Locations List & Selection
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationUsers, setLocationUsers] = useState([]);

  // All Users Flat Table
  const [allUsers, setAllUsers] = useState([]);
  
  // View mode: 'grouped' (Address Directory) or 'flat' (All Users Table)
  const [viewMode, setViewMode] = useState('grouped');

  // Loaders & Errors
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [locationSearch, setLocationSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');

  // User Detail Modal
  const [inspectUser, setInspectUser] = useState(null);

  // 1. Fetch Stats & Locations
  const fetchData = async () => {
    setLoadingStats(true);
    setLoadingLocations(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Stats
      const statsRes = await fetch(`${API_BASE}/api/super-admin/addresses/stats`, { headers });
      const statsData = await statsRes.json();
      if (statsRes.ok && statsData.success) {
        setStats(statsData.data);
      }

      // Locations
      const locRes = await fetch(`${API_BASE}/api/super-admin/addresses/locations`, { headers });
      const locData = await locRes.json();
      if (locRes.ok && locData.success) {
        const locs = locData.locations || [];
        setLocations(locs);

        // Auto select first real location or first available
        if (locs.length > 0) {
          const firstReal = locs.find(l => !l.is_pending_group) || locs[0];
          setSelectedLocation(firstReal);
        }
      } else {
        setError(locData.message || 'Failed to fetch address locations.');
      }

      // All Users Flat
      const allRes = await fetch(`${API_BASE}/api/super-admin/addresses/all-users`, { headers });
      const allData = await allRes.json();
      if (allRes.ok && allData.success) {
        setAllUsers(allData.users || []);
      }
    } catch (err) {
      console.error('Error fetching address user data:', err);
      setError('Network connection failed.');
    } finally {
      setLoadingStats(false);
      setLoadingLocations(false);
    }
  };

  // 2. Fetch Users for Selected Location
  const fetchLocationUsers = async (locationKey) => {
    if (!locationKey) {
      setLocationUsers([]);
      return;
    }

    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ locationKey });
      if (userSearch.trim()) params.append('search', userSearch.trim());

      const res = await fetch(`${API_BASE}/api/super-admin/addresses/location-users?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setLocationUsers(data.users || []);
      } else {
        setLocationUsers([]);
      }
    } catch (err) {
      console.error('Error fetching location users:', err);
      setLocationUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchLocationUsers(selectedLocation.location_key);
    }
  }, [selectedLocation?.location_key, userSearch]);

  // Unique cities list for filter
  const cityList = ['All', ...new Set(locations.map(l => l.city).filter(c => c && c !== 'Various Locations'))];

  // Filtered locations
  const filteredLocations = locations.filter(l => {
    if (selectedCity !== 'All' && l.city !== selectedCity) return false;
    if (locationSearch.trim()) {
      const term = locationSearch.toLowerCase();
      return (
        l.display_title.toLowerCase().includes(term) ||
        l.city.toLowerCase().includes(term) ||
        l.pin_code.includes(term)
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-200 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <MapPin className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Address-wise User Details
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Explore registered users, delivery addresses, colonies, and coverage demographics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grouped'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              Address Directory
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'flat'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              All Users ({allUsers.length})
            </button>
          </div>

          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLocations ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Registered Users</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.total_users}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Locations & Colonies</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.total_unique_locations}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pincodes Covered</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">{stats.total_pincodes} Pincodes</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saved Delivery Addresses</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.users_with_address} <span className="text-xs text-slate-400 font-normal">/ {stats.total_users} Users</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View Mode 1: Address Directory (Grouped Split View) */}
      {viewMode === 'grouped' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Address / Colony Directory List (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-500" />
                  Address Locations ({filteredLocations.length})
                </span>
                {selectedCity !== 'All' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-900">
                    {selectedCity}
                  </span>
                )}
              </div>

              {/* Search & City Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search colony, street, city or pin..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {cityList.length > 2 && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                    {cityList.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedCity(c)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                          selectedCity === c
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Locations Scroll Directory */}
              <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {loadingLocations ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                    <p className="text-xs">Loading address directory...</p>
                  </div>
                ) : filteredLocations.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <MapPin className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-semibold">No addresses found</p>
                    <p className="text-[10px]">Try clearing your search query.</p>
                  </div>
                ) : (
                  filteredLocations.map((loc) => {
                    const isSelected = selectedLocation?.location_key === loc.location_key;

                    return (
                      <div
                        key={loc.location_key}
                        onClick={() => setSelectedLocation(loc)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
                            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}>
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {loc.display_title}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{loc.city}</span>
                                <span>•</span>
                                <span>PIN: {loc.pin_code}</span>
                              </p>
                            </div>
                          </div>

                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            loc.is_pending_group
                              ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                              : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          }`}>
                            {loc.user_count} {loc.user_count === 1 ? 'User' : 'Users'}
                          </span>
                        </div>

                        {/* Order stats mini pill */}
                        {!loc.is_pending_group && (
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                            <span>Orders: <b className="text-slate-700 dark:text-slate-300">{loc.total_orders}</b></span>
                            <span>Spent: <b className="text-emerald-600 dark:text-emerald-400">₹{loc.total_spent}</b></span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Complete User Details for Selected Location (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedLocation ? (
              <>
                {/* Active Location Header Banner */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          {selectedLocation.display_title}
                        </h2>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-900">
                          {selectedLocation.user_count} Registered {selectedLocation.user_count === 1 ? 'User' : 'Users'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>City: <b className="text-slate-800 dark:text-slate-200">{selectedLocation.city}</b></span>
                        <span>•</span>
                        <span>Pincode: <b className="text-slate-800 dark:text-slate-200">{selectedLocation.pin_code}</b></span>
                        {selectedLocation.landmark && (
                          <>
                            <span>•</span>
                            <span>Landmark: <b className="text-slate-800 dark:text-slate-200">{selectedLocation.landmark}</b></span>
                          </>
                        )}
                      </p>
                    </div>

                    {!selectedLocation.is_pending_group && (
                      <a
                        href={getGoogleMapsUrl(selectedLocation)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-900 transition-colors self-start sm:self-auto"
                      >
                        <Map className="w-3.5 h-3.5" />
                        View on Google Maps
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    )}
                  </div>

                  {/* Search inside this location */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search users by name, phone or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                      {locationUsers.length} Users Listed
                    </span>
                  </div>
                </div>

                {/* Users List for this Location */}
                <div className="space-y-3">
                  {loadingUsers ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                      <p className="text-xs">Loading user details...</p>
                    </div>
                  ) : locationUsers.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
                      <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No Users Found
                      </p>
                      <p className="text-xs text-slate-400">
                        No registered users matching search query in this location.
                      </p>
                    </div>
                  ) : (
                    locationUsers.map((u, idx) => {
                      const initials = (u.full_name || 'U').charAt(0).toUpperCase();
                      const regDate = u.registered_at ? new Date(u.registered_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      }) : 'N/A';

                      return (
                        <div
                          key={u.user_id || idx}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* User Avatar & Name & Status */}
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                                {initials}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {u.full_name}
                                  </h3>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                    u.status === 'active'
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                  }`}>
                                    {u.status || 'Active'}
                                  </span>
                                  {u.is_email_verified && (
                                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-3">
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <b>{u.phone}</b>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    {u.email}
                                  </span>
                                </p>
                              </div>
                            </div>

                            {/* View Detail Action */}
                            <button
                              onClick={() => setInspectUser(u)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-500" />
                              View Details
                            </button>
                          </div>

                          {/* Full Address Bar & Stats Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                            {/* Address Box */}
                            <div className="md:col-span-2 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-800/80">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-blue-500" />
                                Full Address ({u.address_type})
                              </p>
                              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                                {u.house_no ? `House No: ${u.house_no}, ` : ''}
                                {u.address_line}
                                {u.landmark ? `, Near ${u.landmark}` : ''}
                                <br />
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {u.city} - {u.pin_code}, {u.state}
                                </span>
                              </p>
                            </div>

                            {/* Store & Orders Mini Card */}
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-800/80 space-y-1">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-400">Assigned Store:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                                  {u.assigned_store_name}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-400">Total Orders:</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                  {u.orders_count} Orders (₹{u.total_spent})
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                                <span>Joined:</span>
                                <span>{regDate}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center text-slate-400 space-y-3">
                <MapPin className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Select an Address Location</h3>
                <p className="text-xs text-slate-400">
                  Choose an address or colony from the left directory to view its connected users and complete profiles.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Mode 2: Flat List / All Registered Users Table */}
      {viewMode === 'flat' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              All Registered Users Directory ({allUsers.length})
            </h3>
            <div className="text-xs text-slate-400">
              Users registered across all Dark Stores & Addresses
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3">User & Contact</th>
                  <th className="px-5 py-3">Primary Delivery Address</th>
                  <th className="px-5 py-3">City & PIN</th>
                  <th className="px-5 py-3">Assigned Store</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Registered On</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {allUsers.map((u) => {
                  const regDate = u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  }) : '-';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {u.full_name}
                          {u.is_email_verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 inline" />}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">📞 {u.phone}</div>
                        <div className="text-xs text-slate-400">✉️ {u.email}</div>
                      </td>

                      <td className="px-5 py-3.5 max-w-xs truncate text-xs text-slate-600 dark:text-slate-300">
                        {u.address}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{u.city}</div>
                        <div className="text-slate-400">{u.pin_code}</div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {u.assigned_store_name}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          u.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {u.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400">
                        {regDate}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        <button
                          onClick={() => setInspectUser(u)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-lg transition-colors cursor-pointer"
                          title="View Complete User Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-5 p-6 my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                  {(inspectUser.full_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {inspectUser.full_name}
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                      {inspectUser.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    User ID: <span className="font-mono text-slate-600 dark:text-slate-300">{inspectUser.user_id || inspectUser.id}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Grid */}
            <div className="space-y-4">
              {/* Contact & Registration Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Details</p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    {inspectUser.phone || 'N/A'}
                  </p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    {inspectUser.email || 'N/A'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Store & Account</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Assigned Store: <b className="text-slate-900 dark:text-white">{inspectUser.assigned_store_name || 'Unassigned'}</b>
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Registered On: <b className="text-slate-900 dark:text-white">{inspectUser.registered_at ? new Date(inspectUser.registered_at).toLocaleString() : (inspectUser.created_at ? new Date(inspectUser.created_at).toLocaleString() : 'N/A')}</b>
                  </p>
                </div>
              </div>

              {/* Complete Address & Map */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Registered Delivery Address ({inspectUser.address_type || 'Primary'})
                  </h4>
                  <a
                    href={getGoogleMapsUrl(inspectUser)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    Open Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5 leading-relaxed">
                  {inspectUser.house_no && <p><b>House/Flat:</b> {inspectUser.house_no}</p>}
                  <p><b>Street / Colony:</b> {inspectUser.address_line || inspectUser.address || 'No Address Line'}</p>
                  {inspectUser.landmark && <p><b>Landmark:</b> {inspectUser.landmark}</p>}
                  <p><b>City:</b> {inspectUser.city} | <b>State:</b> {inspectUser.state || 'India'} | <b>Pincode:</b> {inspectUser.pin_code}</p>
                </div>
              </div>

              {/* Order History Summary */}
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-200">Customer Order History</p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                    Total orders placed: <b>{inspectUser.orders_count || 0} Orders</b>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-blue-500 uppercase">Total Lifetime Spend</span>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-200">₹{inspectUser.total_spent || 0}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectUser(null)}
                className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
