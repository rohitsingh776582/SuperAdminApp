import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Settings, 
  Menu, 
  X, 
  Home, 
  LogOut,
  Store,
  Image as ImageIcon,
  Award,
  MessageSquare,
  Ticket,
  Truck
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Approvals',
      path: '/approve',
      icon: CheckSquare,
    },
    {
      name: 'Users & Agents',
      path: '/users',
      icon: Users,
    },
    {
      name: 'Store Management',
      path: '/stores',
      icon: Store,
    },
    {
      name: 'Promo Banners',
      path: '/banners',
      icon: ImageIcon,
    },
    {
      name: 'Offers & Coupons',
      path: '/offers',
      icon: Ticket,
    },
    {
      name: 'USP Sections',
      path: '/usp',
      icon: Award,
    },
    {
      name: 'Product Reviews',
      path: '/reviews',
      icon: MessageSquare,
    },
    {
      name: 'Delivery Settings',
      path: '/delivery-settings',
      icon: Truck,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg shadow-md shadow-blue-500/20">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide text-white">Apnahome</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Admin Portal</p>
            </div>
          </div>
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Area / User Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800/50">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white ring-2 ring-blue-500/20">
                  {localStorage.getItem('adminUser') ? JSON.parse(localStorage.getItem('adminUser')).name.charAt(0) : 'A'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-semibold text-white truncate">
                  {localStorage.getItem('adminUser') ? JSON.parse(localStorage.getItem('adminUser')).name : 'Admin User'}
                </h2>
                <p className="text-[10px] text-slate-400 truncate text-left">
                  {localStorage.getItem('adminUser') && JSON.parse(localStorage.getItem('adminUser')).role === 'super_admin' ? 'Super Admin' : 'Sub Admin'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.href = '/login';
              }}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
