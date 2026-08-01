import React, { useState } from 'react';
import { 
  Search, 
  UserCheck, 
  UserMinus, 
  Mail, 
  Shield, 
  Clock, 
  SlidersHorizontal 
} from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([
    {
      id: 'USR-8902',
      name: 'Vijay Kumar',
      email: 'vijay.k@apnahome.com',
      role: 'Agent',
      joined: '2026-03-12',
      status: 'Active',
      properties: 24,
    },
    {
      id: 'USR-8901',
      name: 'Anjali Sharma',
      email: 'anjali.s@apnahome.com',
      role: 'Agent',
      joined: '2026-04-18',
      status: 'Active',
      properties: 15,
    },
    {
      id: 'USR-7603',
      name: 'Ramesh Patel',
      email: 'ramesh.p@gmail.com',
      role: 'Buyer',
      joined: '2026-05-02',
      status: 'Active',
      properties: 0,
    },
    {
      id: 'USR-6520',
      name: 'Rohit Sharma',
      email: 'rohit.admin@apnahome.com',
      role: 'Admin',
      joined: '2026-01-10',
      status: 'Active',
      properties: 0,
    },
    {
      id: 'USR-8900',
      name: 'Sameer Sen',
      email: 'sameer.s@apnahome.com',
      role: 'Agent',
      joined: '2026-02-28',
      status: 'Suspended',
      properties: 8,
    },
    {
      id: 'USR-7601',
      name: 'Priya Das',
      email: 'priya.das@yahoo.com',
      role: 'Buyer',
      joined: '2026-06-15',
      status: 'Active',
      properties: 0,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [notification, setNotification] = useState(null);

  const toggleUserStatus = (id) => {
    setUsers(prevUsers => 
      prevUsers.map(user => {
        if (user.id === id) {
          const nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
          setNotification({
            message: `User ${user.name} is now ${nextStatus.toLowerCase()}.`,
            type: nextStatus === 'Active' ? 'success' : 'warning'
          });
          return { ...user, status: nextStatus };
        }
        return user;
      })
    );

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 transform translate-y-0 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full mr-2.5 ${
            notification.type === 'success' ? 'bg-emerald-500' : 'bg-amber-500'
          }`} />
          {notification.message}
        </div>
      )}

      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Users & Agents</h2>
        <p className="text-xs text-slate-400 mt-0.5">Manage portal access roles, view user directories, and monitor active agent registrations.</p>
      </div>

      {/* Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
        {/* Role Filters */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl self-start md:self-auto">
          {['All', 'Agent', 'Buyer', 'Admin'].map((role) => {
            const isActive = roleFilter === role;
            return (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isActive 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {role}s
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search by ID, name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 py-2 pl-9 pr-4 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
          <button className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4">Active Listings</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* User Profile Cell */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 flex items-center space-x-2">
                            <span>{user.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">{user.id}</span>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center mt-0.5">
                            <Mail className="w-3 h-3 mr-1 text-slate-300" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Cell */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        user.role === 'Admin' ? 'bg-indigo-50 text-indigo-700' :
                        user.role === 'Agent' ? 'bg-blue-50 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        <Shield className="w-3.5 h-3.5 mr-1" />
                        {user.role}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center text-slate-600 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-300" />
                        {user.joined}
                      </div>
                    </td>

                    {/* Listings */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700">{user.properties} listings</span>
                    </td>

                    {/* Status Cell */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          user.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                        {user.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'Admin' ? (
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                            user.status === 'Active'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                          }`}
                        >
                          {user.status === 'Active' ? (
                            <>
                              <UserMinus className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300 font-semibold italic">System Locked</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400">
                    No users found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
