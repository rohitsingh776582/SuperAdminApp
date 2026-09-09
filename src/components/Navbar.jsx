import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Search, Sun, Moon, Store, ChevronDown, Check, MapPin } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ toggleSidebar }) => {
  const location = useLocation();
  const { stores, selectedStore, setSelectedStoreId, loadingStores } = useStore();
  const { isDark, toggleTheme } = useTheme();
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);

  // Generate breadcrumb title from route path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/orders') return 'Orders Management';
    if (path === '/delivered-orders') return 'Delivered Orders';
    if (path === '/cancelled-orders') return 'Cancelled Orders';
    if (path === '/address-users') return 'Address-wise User Details';
    if (path === '/approve') return 'Vendor Approvals';
    if (path === '/stores') return 'Store Management';
    if (path === '/banners') return 'Promo Banners';
    if (path === '/usp') return 'USP Sections';
    if (path === '/reviews') return 'Product Reviews';
    return 'Admin Panel';
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 backdrop-blur-md shadow-sm transition-colors duration-200">
      {/* Left side: Hamburger and Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden focus:outline-none transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-800 dark:text-white tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="hidden sm:block text-xs text-slate-400 font-medium">
            Super Admin View
          </p>
        </div>
      </div>

      {/* Center/Right side: Store Selector & Actions */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Active Store Selector */}
        <div className="relative">
          <button
            onClick={() => setStoreDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-slate-800/80 hover:bg-blue-100/80 dark:hover:bg-slate-800 border border-blue-200 dark:border-slate-700 text-blue-900 dark:text-blue-300 rounded-xl text-xs font-semibold shadow-sm transition-all focus:outline-none"
            title="Switch Selected Dark Store"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              <Store className="w-3.5 h-3.5" />
            </div>
            <div className="text-left max-w-[140px] sm:max-w-[180px] truncate">
              <p className="text-[10px] text-blue-500 dark:text-blue-400 font-medium uppercase tracking-wider leading-none">Active Store</p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                {loadingStores ? 'Loading...' : (selectedStore?.store_name || 'Select Store')}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ml-1 flex-shrink-0" />
          </button>

          {/* Store Dropdown Menu */}
          {storeDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setStoreDropdownOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Select Dark Store</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full">
                    {stores.length} Stores
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
                  {stores.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No stores found
                    </div>
                  ) : (
                    stores.map((s) => {
                      const isSelected = selectedStore?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedStoreId(s.id);
                            setStoreDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 ${
                            isSelected 
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-medium' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold truncate">{s.store_name}</span>
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                s.status === 'open' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                              }`} />
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
                              <span className="truncate">{s.address || 'No address'} {s.pin_code ? `(${s.pin_code})` : ''}</span>
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Light / Dark Mode Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400 animate-in spin-in-180 duration-200" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 animate-in spin-in-180 duration-200" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          </button>
        </div>

        {/* Profile indicator (Mobile view) */}
        <div className="flex items-center space-x-2 md:hidden">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="Admin User"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
