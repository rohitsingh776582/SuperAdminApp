import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Search, Sun, Moon } from 'lucide-react';

const Navbar = ({ toggleSidebar }) => {
  const location = useLocation();

  // Generate breadcrumb title from route path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path === '/approve') return 'Listing Approvals';
    if (path === '/users') return 'Users & Agents';
    if (path === '/settings') return 'Portal Settings';
    return 'Admin Panel';
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full h-16 px-6 bg-white border-b border-slate-200/80 backdrop-blur-md shadow-sm">
      {/* Left side: Hamburger and Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden focus:outline-none transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-800 tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="hidden sm:block text-xs text-slate-400 font-medium">
            Welcome back, Rohit
          </p>
        </div>
      </div>

      {/* Center/Right side: Actions */}
      <div className="flex items-center space-x-4">
        {/* Search bar */}
        <div className="relative hidden md:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4.5 h-4.5 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search portal..."
            className="w-64 py-2 pl-10 pr-4 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Action icons */}
        <button 
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          title="Light/Dark Mode toggle (Demo)"
        >
          <Sun className="w-5 h-5 text-slate-500" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
          </button>
        </div>

        {/* Profile indicator (Mobile view) */}
        <div className="flex items-center space-x-2 md:hidden">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="Admin User"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
