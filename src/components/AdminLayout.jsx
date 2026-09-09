import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 transition-colors duration-200">
      {/* Sidebar Component */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Navbar Header */}
        <Navbar toggleSidebar={toggleSidebar} />

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/90 p-6 md:p-8 custom-scrollbar transition-colors duration-200">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
