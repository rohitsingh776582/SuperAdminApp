import React, { useState, useEffect } from 'react';
import { 
  Store, 
  MapPin, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertCircle, 
  ExternalLink,
  Activity,
  CheckCircle2,
  XCircle,
  X,
  Users,
  Shield,
  ShieldAlert,
  UserX,
  Link,
  Unlink,
  Check,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000') + '/api/admin';

const Stores = () => {
  // Navigation / Tabs State
  const [activeTab, setActiveTab] = useState('stores'); // 'stores' | 'assignments'

  // Global State for data
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'open' | 'closed'
  const [notification, setNotification] = useState(null);

  // Authentication & Authorization check
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const isSuperAdmin = adminUser.role === 'super_admin';

  // --- STORES TAB STATES ---
  // Add/Edit Store Form State
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [storeFormLoading, setStoreFormLoading] = useState(false);
  const [storeFormError, setStoreFormError] = useState(null);
  const [storeFormData, setStoreFormData] = useState({
    store_name: '',
    address: '',
    latitude: '',
    longitude: '',
    pin_code: '',
    status: 'open'
  });

  // Delete Store State
  const [deletingStore, setDeletingStore] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);


  // --- SUB-ADMIN ASSIGNMENTS STATES ---
  const [subAdmins, setSubAdmins] = useState([]);
  const [subAdminsLoading, setSubAdminsLoading] = useState(false);
  const [subAdminsError, setSubAdminsError] = useState(null);
  
  // Assign/Edit Assignment modal states
  const [assigningAdmin, setAssigningAdmin] = useState(null);
  const [assignmentFormLoading, setAssignmentFormLoading] = useState(false);
  const [assignmentFormError, setAssignmentFormError] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    store_id: '',
    manage_inventory: true,
    view_orders: true
  });

  // Unassign Modal states
  const [unassigningAdmin, setUnassigningAdmin] = useState(null);
  const [unassignLoading, setUnassignLoading] = useState(false);


  // Toast notifier helper
  const triggerToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch stores
  const fetchStores = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/stores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.status === 200 && data.success) {
        setStores(data.stores || []);
      } else {
        setError(data.message || 'Failed to fetch stores.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Sub-Admins
  const fetchSubAdmins = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setSubAdminsLoading(true);
    setSubAdminsError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/sub-admins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.status === 200 && data.success) {
        setSubAdmins(data.subAdmins || []);
      } else {
        setSubAdminsError(data.message || 'Failed to fetch sub-admins list.');
      }
    } catch (err) {
      console.error(err);
      setSubAdminsError('Could not retrieve sub-admin staff details.');
    } finally {
      setSubAdminsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
    fetchSubAdmins();
  }, []);

  // --- STORES TAB ACTIONS ---
  // Handle Add Click
  const handleOpenAddModal = () => {
    setEditingStore(null);
    setStoreFormData({
      store_name: '',
      address: '',
      latitude: '',
      longitude: '',
      pin_code: '',
      status: 'open'
    });
    setStoreFormError(null);
    setIsStoreModalOpen(true);
  };

  // Handle Edit Click
  const handleOpenEditModal = (store) => {
    setEditingStore(store);
    setStoreFormData({
      store_name: store.store_name,
      address: store.address,
      latitude: store.latitude.toString(),
      longitude: store.longitude.toString(),
      pin_code: store.pin_code || '',
      status: store.status || 'open'
    });
    setStoreFormError(null);
    setIsStoreModalOpen(true);
  };

  // Submit Add or Edit Store Form
  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    // Validation
    const lat = parseFloat(storeFormData.latitude);
    const lng = parseFloat(storeFormData.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setStoreFormError('Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setStoreFormError('Longitude must be a valid number between -180 and 180.');
      return;
    }

    setStoreFormLoading(true);
    setStoreFormError(null);

    try {
      const url = editingStore 
        ? `${API_BASE_URL}/stores/${editingStore.id}` 
        : `${API_BASE_URL}/stores`;
      const method = editingStore ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(storeFormData)
      });
      const data = await response.json();

      if (response.status === 200 || response.status === 201) {
        triggerToast(
          editingStore ? 'Store updated successfully.' : 'Store created successfully.',
          'success'
        );
        fetchStores();
        setIsStoreModalOpen(false);
      } else {
        setStoreFormError(data.message || 'Failed to save store details.');
      }
    } catch (err) {
      console.error(err);
      setStoreFormError('Connection failed. Server offline.');
    } finally {
      setStoreFormLoading(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = (store) => {
    setDeletingStore(store);
  };

  // Execute Delete Store
  const handleDeleteStore = async () => {
    if (!deletingStore) return;
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setDeleteLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/stores/${deletingStore.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.status === 200 && data.success) {
        triggerToast('Store deleted successfully.', 'success');
        setStores(prev => prev.filter(s => s.id !== deletingStore.id));
        setDeletingStore(null);
      } else {
        triggerToast(data.message || 'Failed to delete store.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Connection failed. Could not delete store.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- SUB-ADMIN ASSIGNMENTS ACTIONS ---
  
  // Open Assign Store Modal
  const handleOpenAssignModal = (admin) => {
    setAssigningAdmin(admin);
    setAssignmentData({
      store_id: admin.assignedStore ? admin.assignedStore.store_id : '',
      manage_inventory: admin.assignedStore && admin.assignedStore.permissions
        ? !!admin.assignedStore.permissions.manage_inventory 
        : true,
      view_orders: admin.assignedStore && admin.assignedStore.permissions
        ? !!admin.assignedStore.permissions.view_orders 
        : true
    });
    setAssignmentFormError(null);
  };

  // Submit Store Assignment (Create or Edit)
  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!assigningAdmin) return;
    
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    if (!assignmentData.store_id) {
      setAssignmentFormError('Please select a store to assign.');
      return;
    }

    setAssignmentFormLoading(true);
    setAssignmentFormError(null);

    const hasPrevStore = !!assigningAdmin.assignedStore;

    try {
      const url = hasPrevStore 
        ? `${API_BASE_URL}/sub-admin-stores/${assigningAdmin.id}`
        : `${API_BASE_URL}/sub-admin-stores`;
      const method = hasPrevStore ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          admin_id: assigningAdmin.id,
          store_id: assignmentData.store_id,
          permissions: {
            manage_inventory: assignmentData.manage_inventory,
            view_orders: assignmentData.view_orders
          }
        })
      });
      
      const data = await response.json();

      if (response.status === 200 || response.status === 201) {
        triggerToast(
          hasPrevStore ? 'Store assignment updated successfully.' : 'Store assigned successfully.',
          'success'
        );
        fetchSubAdmins();
        setAssigningAdmin(null);
      } else {
        setAssignmentFormError(data.message || 'Failed to assign store to sub-admin.');
      }
    } catch (err) {
      console.error(err);
      setAssignmentFormError('Connection failed. Server offline.');
    } finally {
      setAssignmentFormLoading(false);
    }
  };

  // Open Unassign Modal
  const handleUnassignConfirm = (admin) => {
    setUnassigningAdmin(admin);
  };

  // Execute Unassign (DELETE Assignment)
  const handleUnassignExecute = async () => {
    if (!unassigningAdmin) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setUnassignLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/sub-admin-stores/${unassigningAdmin.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.status === 200 && data.success) {
        triggerToast('Store assignment removed successfully.', 'success');
        fetchSubAdmins();
        setUnassigningAdmin(null);
      } else {
        triggerToast(data.message || 'Failed to remove store assignment.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Connection failed. Could not process removal.', 'error');
    } finally {
      setUnassignLoading(false);
    }
  };

  // --- FILTERING & STATS LOGIC ---
  const totalStores = stores.length;
  const openStores = stores.filter(s => s.status === 'open').length;
  const closedStores = stores.filter(s => s.status === 'closed').length;

  const totalAssignedSubAdmins = subAdmins.filter(sa => sa.assignedStore).length;
  const totalUnassignedSubAdmins = subAdmins.filter(sa => !sa.assignedStore).length;

  const filteredStores = stores.filter(store => {
    const matchesSearch = 
      store.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.pin_code && store.pin_code.includes(searchTerm));
    const matchesStatus = statusFilter === 'All' || store.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSubAdmins = subAdmins.filter(sa => {
    const matchesSearch = 
      sa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sa.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sa.phone && sa.phone.includes(searchTerm)) ||
      (sa.assignedStore && sa.assignedStore.store_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'All' 
        ? true 
        : statusFilter === 'open' 
          ? !!sa.assignedStore 
          : !sa.assignedStore; // Treat 'open' as Assigned, 'closed' as Unassigned in sub-admin tab, or general check.
    
    return matchesSearch && (activeTab === 'stores' ? true : true); // simple filters for now
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 transform translate-y-0 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full mr-2.5 ${
            notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          }`} />
          {notification.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Store & Staff Hub</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage local warehouse locations and assign sub-admin dark store managers.</p>
        </div>
        {isSuperAdmin && activeTab === 'stores' && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/15 hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus size={16} />
            Add Store
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('stores');
            setSearchTerm('');
            setStatusFilter('All');
          }}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === 'stores'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Store size={15} />
          Store Directory
        </button>
        <button
          onClick={() => {
            setActiveTab('assignments');
            setSearchTerm('');
            setStatusFilter('All');
          }}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === 'assignments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users size={15} />
          Sub-Admin Assignments
        </button>
      </div>

      {/* Stats Cards (Dynamic based on Tab) */}
      {activeTab === 'stores' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Store size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Stores</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalStores}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active (Open)</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{openStores}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <XCircle size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Closed</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{closedStores}</h3>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Sub-Admins</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{subAdmins.length}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Assigned to Store</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalAssignedSubAdmins}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <ShieldAlert size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Unassigned Hub Manager</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalUnassignedSubAdmins}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl self-start md:self-auto">
          {activeTab === 'stores' ? (
            ['All', 'open', 'closed'].map((status) => {
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {status === 'All' ? 'All Stores' : status === 'open' ? 'Open' : 'Closed'}
                </button>
              );
            })
          ) : (
            ['All', 'assigned', 'unassigned'].map((filter) => {
              const isActive = statusFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {filter === 'All' ? 'All Staff' : filter === 'assigned' ? 'Assigned' : 'Unassigned'}
                </button>
              );
            })
          )}
        </div>

        {/* Search */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder={activeTab === 'stores' ? "Search by name, address, pin..." : "Search staff name, email, store..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 py-2 pl-9 pr-4 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
            />
          </div>
          <button 
            onClick={activeTab === 'stores' ? fetchStores : fetchSubAdmins}
            className="px-3.5 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* --- TAB 1: STORES DIRECTORY --- */}
      {activeTab === 'stores' && (
        <>
          {loading ? (
            <div className="py-20 text-center">
              <span className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin inline-block"></span>
              <p className="text-xs text-slate-400 mt-3 font-semibold">Loading Stores list...</p>
            </div>
          ) : error ? (
            <div className="p-8 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 max-w-lg mx-auto">
              <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-sm font-bold text-rose-900">Database Connection Error</h4>
                <p className="text-xs text-rose-700 mt-1">{error}</p>
                <button 
                  onClick={fetchStores} 
                  className="text-xs font-bold text-rose-800 underline mt-2 hover:text-rose-900 cursor-pointer block"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredStores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStores.map((store) => (
                <div 
                  key={store.id} 
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                          <Store size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 truncate max-w-[170px]">{store.store_name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 uppercase ${
                            store.status === 'open' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            <span className={`w-1 h-1 rounded-full mr-1 ${
                              store.status === 'open' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`} />
                            {store.status === 'open' ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      </div>
                      {isSuperAdmin && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(store)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Store"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteConfirm(store)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Store"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="leading-normal">{store.address}</span>
                      </div>
                      {store.pin_code && (
                        <div className="flex items-center gap-2">
                          <Activity size={14} className="text-slate-400 flex-shrink-0" />
                          <span>PIN Code: <strong className="text-slate-700">{store.pin_code}</strong></span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">Coordinates: {store.latitude}, {store.longitude}</span>
                      </div>
                    </div>
                  </div>

                  {/* Map Link */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <a
                      href={`https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-2 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink size={13} />
                      View on Google Maps
                    </a>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
              <Store className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 mt-3">No Stores Found</h3>
              <p className="text-xs text-slate-400 mt-1">Try resetting the filters or adding a new store location.</p>
            </div>
          )}
        </>
      )}

      {/* --- TAB 2: STAFF ASSIGNMENTS --- */}
      {activeTab === 'assignments' && (
        <>
          {subAdminsLoading ? (
            <div className="py-20 text-center">
              <span className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin inline-block"></span>
              <p className="text-xs text-slate-400 mt-3 font-semibold">Retrieving staff lists...</p>
            </div>
          ) : subAdminsError ? (
            <div className="p-8 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 max-w-lg mx-auto">
              <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-sm font-bold text-rose-900">Database Connection Error</h4>
                <p className="text-xs text-rose-700 mt-1">{subAdminsError}</p>
                <button 
                  onClick={fetchSubAdmins} 
                  className="text-xs font-bold text-rose-800 underline mt-2 hover:text-rose-900 cursor-pointer block"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredSubAdmins.length > 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Sub-Admin Manager</th>
                      <th className="px-6 py-4">Assigned Dark Store</th>
                      <th className="px-6 py-4">Permissions</th>
                      <th className="px-6 py-4">Account Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredSubAdmins
                      .filter(sa => {
                        if (statusFilter === 'assigned') return !!sa.assignedStore;
                        if (statusFilter === 'unassigned') return !sa.assignedStore;
                        return true;
                      })
                      .map((admin) => (
                        <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                          
                          {/* Name / Email Profile */}
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3.5">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                {admin.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-850">{admin.name}</h4>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Mail size={12} className="text-slate-300" />
                                  {admin.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Assigned Store */}
                          <td className="px-6 py-4">
                            {admin.assignedStore ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100 inline-block">
                                  {admin.assignedStore.store_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded text-xs font-medium border border-slate-100 italic inline-block">
                                Unassigned
                              </span>
                            )}
                          </td>

                          {/* Permissions */}
                          <td className="px-6 py-4">
                            {admin.assignedStore ? (
                              <div className="flex flex-col gap-1">
                                <span className="flex items-center text-xs text-slate-600 font-medium">
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                    admin.assignedStore.permissions.manage_inventory ? 'bg-emerald-500' : 'bg-slate-300'
                                  }`} />
                                  Manage Inventory: {admin.assignedStore.permissions.manage_inventory ? 'Yes' : 'No'}
                                </span>
                                <span className="flex items-center text-xs text-slate-600 font-medium">
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                    admin.assignedStore.permissions.view_orders ? 'bg-emerald-500' : 'bg-slate-300'
                                  }`} />
                                  View Orders: {admin.assignedStore.permissions.view_orders ? 'Yes' : 'No'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300 italic text-xs">No permissions active</span>
                            )}
                          </td>

                          {/* Account Status Badge */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              admin.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : admin.status === 'suspended'
                                  ? 'bg-rose-50 text-rose-700 border-rose-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {admin.status === 'active' ? 'Active' : admin.status === 'suspended' ? 'Suspended' : 'Pending Approval'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            {isSuperAdmin ? (
                              <div className="flex items-center justify-end gap-2.5">
                                <button
                                  onClick={() => handleOpenAssignModal(admin)}
                                  className="inline-flex items-center gap-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  <Link size={12} />
                                  <span>{admin.assignedStore ? 'Modify' : 'Assign Store'}</span>
                                </button>
                                {admin.assignedStore && (
                                  <button
                                    onClick={() => handleUnassignConfirm(admin)}
                                    className="inline-flex items-center gap-1 hover:bg-rose-50 border border-transparent hover:border-rose-100 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-all cursor-pointer"
                                    title="Unassign Store"
                                  >
                                    <Unlink size={14} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300 font-semibold italic">System Locked</span>
                            )}
                          </td>

                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
              <UserX className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 mt-3">No Sub-Admins Found</h3>
              <p className="text-xs text-slate-400 mt-1">There are no sub-admin managers in the system matching filters.</p>
            </div>
          )}
        </>
      )}


      {/* --- MODALS SECTION --- */}

      {/* 1. Add / Edit Store Modal */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                {editingStore ? 'Edit Store Hub' : 'Add New Store Hub'}
              </h3>
              <button 
                onClick={() => setIsStoreModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {storeFormError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{storeFormError}</span>
              </div>
            )}

            <form onSubmit={handleStoreSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Store Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Noida Main Hub"
                  value={storeFormData.store_name}
                  onChange={(e) => setStoreFormData(prev => ({ ...prev, store_name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs text-slate-700 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Address
                </label>
                <textarea
                  required
                  placeholder="Full physical address..."
                  value={storeFormData.address}
                  onChange={(e) => setStoreFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows="3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs text-slate-700 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Latitude
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 28.6139"
                    value={storeFormData.latitude}
                    onChange={(e) => setStoreFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs text-slate-700 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Longitude
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 77.2090"
                    value={storeFormData.longitude}
                    onChange={(e) => setStoreFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs text-slate-700 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Pin Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 201301"
                    value={storeFormData.pin_code}
                    onChange={(e) => setStoreFormData(prev => ({ ...prev, pin_code: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs text-slate-700 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={storeFormData.status}
                    onChange={(e) => setStoreFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs text-slate-700 transition-all bg-white"
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsStoreModalOpen(false)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={storeFormLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {storeFormLoading ? (
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    'Save Store'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Delete Store Confirmation Modal */}
      {deletingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden p-6 sm:p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertCircle size={24} className="animate-pulse" />
            </div>
            
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Delete Store</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to permanently delete the store <strong className="text-slate-700">"{deletingStore.store_name}"</strong>? This will remove all associated configurations and maps.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeletingStore(null)}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStore}
                disabled={deleteLoading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {deleteLoading ? (
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Assign / Edit Sub-Admin Store Modal */}
      {assigningAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                {assigningAdmin.assignedStore ? 'Modify Store Assignment' : 'Assign Store to Manager'}
              </h3>
              <button 
                onClick={() => setAssigningAdmin(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold">
                {assigningAdmin.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-700">{assigningAdmin.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{assigningAdmin.email}</p>
              </div>
            </div>

            {assignmentFormError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{assignmentFormError}</span>
              </div>
            )}

            <form onSubmit={handleAssignmentSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Dark Store / Warehouse
                </label>
                <select
                  required
                  value={assignmentData.store_id}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, store_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs text-slate-700 transition-all bg-white"
                >
                  <option value="">-- Choose Store location --</option>
                  {stores.map(st => (
                    <option key={st.id} value={st.id}>{st.store_name} ({st.address})</option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Assigned Store Permissions
                </span>
                
                <div className="flex flex-col gap-2.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={assignmentData.manage_inventory}
                      onChange={(e) => setAssignmentData(prev => ({ ...prev, manage_inventory: e.target.checked }))}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300"
                    />
                    Manage Store Inventory (Add/edit local products)
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={assignmentData.view_orders}
                      onChange={(e) => setAssignmentData(prev => ({ ...prev, view_orders: e.target.checked }))}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300"
                    />
                    View Orders (Track and fulfill local deliveries)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAssigningAdmin(null)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignmentFormLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {assignmentFormLoading ? (
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    'Save Assignment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Remove / Unassign Store Assignment Confirmation Modal */}
      {unassigningAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden p-6 sm:p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <UserX size={24} className="animate-pulse" />
            </div>
            
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Unassign Store Manager</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-700">"{unassigningAdmin.name}"</strong> from managing their assigned store <strong className="text-slate-700">"{unassigningAdmin.assignedStore?.store_name}"</strong>?
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setUnassigningAdmin(null)}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnassignExecute}
                disabled={unassignLoading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {unassignLoading ? (
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                ) : (
                  'Remove Assignment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Stores;
