import React from 'react';
import { 
  Building2, 
  Clock, 
  Users2, 
  MessageSquareCode, 
  ArrowUpRight, 
  ArrowDownRight, 
  Eye, 
  ThumbsUp, 
  ThumbsDown 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const stats = [
    {
      title: 'Active Listings',
      value: '1,248',
      change: '+14.6%',
      isPositive: true,
      timeframe: 'vs last month',
      icon: Building2,
      color: 'blue',
      glow: 'shadow-blue-500/10 border-blue-100',
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Pending Approvals',
      value: '38',
      change: '+4 new',
      isPositive: true,
      timeframe: 'requires action',
      icon: Clock,
      color: 'amber',
      glow: 'shadow-amber-500/10 border-amber-100',
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Registered Agents',
      value: '294',
      change: '+8.2%',
      isPositive: true,
      timeframe: 'vs last month',
      icon: Users2,
      color: 'emerald',
      glow: 'shadow-emerald-500/10 border-emerald-100',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Total Inquiries',
      value: '4,102',
      change: '-2.4%',
      isPositive: false,
      timeframe: 'vs last month',
      icon: MessageSquareCode,
      color: 'indigo',
      glow: 'shadow-indigo-500/10 border-indigo-100',
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
  ];

  const recentListings = [
    {
      id: 'PROP-9042',
      title: 'Skyline Luxury Penthouse',
      agent: 'Vijay Kumar',
      location: 'Sector 62, Noida',
      price: '₹2.4 Cr',
      type: 'Sale',
      status: 'Pending',
      date: '2026-07-28',
    },
    {
      id: 'PROP-9041',
      title: 'Greenwood 3BHK Villa',
      agent: 'Anjali Sharma',
      location: 'Whitefield, Bangalore',
      price: '₹1.8 Cr',
      type: 'Sale',
      status: 'Approved',
      date: '2026-07-27',
    },
    {
      id: 'PROP-9040',
      title: 'Cozy Studio Apartment',
      agent: 'Rohan Mehta',
      location: 'Andheri West, Mumbai',
      price: '₹45,000/mo',
      type: 'Rent',
      status: 'Approved',
      date: '2026-07-27',
    },
    {
      id: 'PROP-9039',
      title: 'Commercial Office Space',
      agent: 'Sameer Sen',
      location: 'DLF Phase 3, Gurgaon',
      price: '₹3.5 Cr',
      type: 'Sale',
      status: 'Rejected',
      date: '2026-07-26',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative p-6 md:p-8 rounded-3xl bg-slate-900 overflow-hidden shadow-xl shadow-slate-900/10">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Apnahome Portal Overview</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Monitor property approvals, manage verified agent profiles, and analyze search trends to make real estate listing seamless for buyers and sellers.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.title}
              className={`p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ${stat.glow}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">{stat.title}</span>
                <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                  stat.isPositive 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'bg-rose-50 text-rose-700'
                }`}>
                  {stat.isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {stat.change}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400 font-medium">
                {stat.timeframe}
              </p>
            </div>
          );
        })}
      </div>

      {/* Lower Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Recent Pending Listings */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Latest Listing Submissions</h3>
              <p className="text-xs text-slate-400 mt-0.5">Properties awaiting approval or recently updated</p>
            </div>
            <Link 
              to="/approve" 
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 hover:underline"
            >
              <span>Manage Approvals</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3.5">Property Details</th>
                  <th className="px-6 py-3.5">Agent</th>
                  <th className="px-6 py-3.5">Price / Type</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentListings.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{prop.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{prop.location}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{prop.agent}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{prop.price}</div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">{prop.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        prop.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        prop.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          prop.status === 'Approved' ? 'bg-emerald-500' :
                          prop.status === 'Pending' ? 'bg-amber-500' :
                          'bg-rose-500'
                        }`} />
                        {prop.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to="/approve" 
                        className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View Submission"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Quick Action Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Admin Actions</h3>
            <div className="grid grid-cols-1 gap-2.5">
              <Link
                to="/approve"
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-slate-800">Pending Approvals</div>
                    <div className="text-[11px] text-slate-400 font-medium">Verify listed properties</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">38</span>
              </Link>

              <Link
                to="/users"
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                    <Users2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-slate-800">Verify Agent Profiles</div>
                    <div className="text-[11px] text-slate-400 font-medium">12 active verification requests</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">12</span>
              </Link>
            </div>
          </div>

          {/* Quick Stats Summary Card */}
          <div className="p-6 bg-gradient-to-tr from-slate-950 to-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">System Health</h4>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Vite React Dev Server</span>
                <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full">
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Tailwind Build Engine</span>
                <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Database Connection</span>
                <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full">
                  Connected
                </span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <p className="text-[10px] text-slate-500 font-mono">Last synced: Just now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
