import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Search, 
  Shield,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000') + '/api/admin';

const Approve = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [stores, setStores] = useState([]);
  const [subAdminTab, setSubAdminTab] = useState('inactive'); // 'inactive' (Pending approval) | 'active' (Approved)
  const [subSearch, setSubSearch] = useState('');
  const [subAdminsLoading, setSubAdminsLoading] = useState(false);
  const [subAdminsError, setSubAdminsError] = useState(null);

  const [notification, setNotification] = useState(null);

  // Authentication & Authorization check
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const isSuperAdmin = adminUser.role === 'super_admin';

  // Vendor Edit state
  const [editingVendor, setEditingVendor] = useState(null);
  const [editForm, setEditForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    status: '',
    storeId: '',
    manageInventory: true,
    viewOrders: true
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Vendor Delete state
  const [deletingVendor, setDeletingVendor] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast notifier helper
  const triggerToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Sub Admins from backend
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
        setSubAdmins(data.subAdmins);
      } else {
        setSubAdminsError(data.message || 'Failed to retrieve sub-admins list.');
      }
    } catch (err) {
      console.error(err);
      setSubAdminsError('Could not connect to backend server.');
    } finally {
      setSubAdminsLoading(false);
    }
  };

  // Fetch Stores from backend
  const fetchStores = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/stores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.status === 200 && data.success) {
        setStores(data.stores);
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
  };

  useEffect(() => {
    fetchSubAdmins();
    fetchStores();
  }, []);

  // Handle Sub-Admin status toggle (Backend API)
  const handleUpdateSubAdminStatus = async (id, newStatus) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/sub-admins/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();

      if (response.status === 200 && data.success) {
        setSubAdmins(prev => prev.map(sa => sa.id === id ? { ...sa, status: newStatus } : sa));
        const saName = subAdmins.find(sa => sa.id === id)?.name || 'Sub-Admin';
        triggerToast(
          `Sub-Admin "${saName}" account ${newStatus === 'active' ? 'approved & activated' : 'suspended'} successfully.`,
          newStatus === 'active' ? 'success' : 'error'
        );
      } else {
        triggerToast(data.message || 'Failed to update sub-admin status.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Connection failed. Could not sync status with database.', 'error');
    }
  };

  // Open Edit Modal
  const handleStartEdit = (vendor) => {
    setEditingVendor(vendor);
    setEditForm({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone || '',
      status: vendor.status,
      storeId: vendor.assignedStore ? vendor.assignedStore.store_id : '',
      manageInventory: vendor.assignedStore && vendor.assignedStore.permissions
        ? !!vendor.assignedStore.permissions.manage_inventory 
        : true,
      viewOrders: vendor.assignedStore && vendor.assignedStore.permissions
        ? !!vendor.assignedStore.permissions.view_orders 
        : true
    });
    setEditError(null);
  };

  // Submit Edit Vendor Details & Store Assignment Mapping
  const handleUpdateVendor = async (e) => {
    e.preventDefault();
    if (!editingVendor) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setEditLoading(true);
    setEditError(null);

    try {
      // 1. Update main vendor details
      const response = await fetch(`${API_BASE_URL}/sub-admins/${editingVendor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          status: editForm.status
        })
      });
      const vendorData = await response.json();

      if (response.status !== 200 || !vendorData.success) {
        setEditError(vendorData.message || 'Failed to update vendor details.');
        setEditLoading(false);
        return;
      }

      // 2. Manage Store Assignment Mapping (Create, Update, or Delete mapping)
      const hadStore = !!editingVendor.assignedStore;
      const wantStore = !!editForm.storeId;
      let finalAssignedStore = null;

      if (wantStore) {
        const mappingBody = {
          admin_id: editingVendor.id,
          store_id: editForm.storeId,
          permissions: {
            manage_inventory: editForm.manageInventory,
            view_orders: editForm.viewOrders
          }
        };

        const mappingUrl = hadStore 
          ? `${API_BASE_URL}/sub-admin-stores/${editingVendor.id}`
          : `${API_BASE_URL}/sub-admin-stores`;
        const mappingMethod = hadStore ? 'PUT' : 'POST';

        const mapResponse = await fetch(mappingUrl, {
          method: mappingMethod,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(mappingBody)
        });
        const mapData = await mapResponse.json();

        if (mapResponse.status === 200 || mapResponse.status === 201) {
          const matchedStore = stores.find(st => st.id === editForm.storeId);
          finalAssignedStore = {
            mapping_id: mapData.assignment.id,
            store_id: mapData.assignment.store_id,
            store_name: matchedStore ? matchedStore.store_name : 'Unknown Store',
            permissions: mapData.assignment.permissions
          };
        } else {
          setEditError(mapData.message || 'Failed to update store mapping.');
          setEditLoading(false);
          return;
        }
      } else if (hadStore && !wantStore) {
        // Unassign store -> DELETE mapping
        const deleteResponse = await fetch(`${API_BASE_URL}/sub-admin-stores/${editingVendor.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (deleteResponse.status !== 200) {
          const deleteData = await deleteResponse.json();
          setEditError(deleteData.message || 'Failed to remove store mapping.');
          setEditLoading(false);
          return;
        }
      }

      // 3. Update React local state
      const updatedVendorRecord = {
        ...vendorData.vendor,
        assignedStore: finalAssignedStore
      };

      setSubAdmins(prev => prev.map(sa => sa.id === editingVendor.id ? updatedVendorRecord : sa));
      triggerToast(`Vendor "${updatedVendorRecord.name}" updated successfully.`, 'success');
      setEditingVendor(null);
    } catch (err) {
      console.error(err);
      setEditError('Connection failed. Server offline.');
    } finally {
      setEditLoading(false);
    }
  };

  // Open Delete Modal
  const handleConfirmDelete = (vendor) => {
    setDeletingVendor(vendor);
  };

  // Submit Delete Vendor
  const handleDeleteVendor = async () => {
    if (!deletingVendor) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setDeleteLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/sub-admins/${deletingVendor.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.status === 200 && data.success) {
        setSubAdmins(prev => prev.filter(sa => sa.id !== deletingVendor.id));
        triggerToast(`Vendor account deleted successfully.`, 'success');
        setDeletingVendor(null);
      } else {
        triggerToast(data.message || 'Failed to delete vendor account.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Connection failed. Could not delete vendor.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Filtering ---
  const filteredSubAdmins = subAdmins.filter(sa => {
    const matchesTab = sa.status === subAdminTab;
    const matchesSearch = 
      sa.name.toLowerCase().includes(subSearch.toLowerCase()) ||
      sa.email.toLowerCase().includes(subSearch.toLowerCase()) ||
      (sa.phone && sa.phone.includes(subSearch));
    return matchesTab && matchesSearch;
  });

  const getSubCount = (status) => subAdmins.filter(sa => sa.status === status).length;

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
      <div>
        <h2 className="text-xl font-bold text-slate-900">Sub-Admin / Vendor Approvals</h2>
        <p className="text-xs text-slate-400 mt-0.5">Approve, activate, or suspend registered dark store managers and local vendors.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl">
          <button
            onClick={() => setSubAdminTab('inactive')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              subAdminTab === 'inactive' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Pending Approval</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
              subAdminTab === 'inactive' ? 'bg-slate-950 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {getSubCount('inactive')}
            </span>
          </button>
          <button
            onClick={() => setSubAdminTab('active')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              subAdminTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Active Vendors</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
              subAdminTab === 'active' ? 'bg-slate-950 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {getSubCount('active')}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search by name, email..."
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              className="w-full md:w-64 py-2 pl-9 pr-4 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
            />
          </div>
          <button 
            onClick={fetchSubAdmins}
            className="px-3.5 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Refresh List
          </button>
        </div>
      </div>

      {/* Loader or Error states */}
      {subAdminsLoading ? (
        <div className="py-20 text-center">
          <span className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin inline-block"></span>
          <p className="text-xs text-slate-400 mt-3 font-semibold">Loading Sub-Admins list...</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubAdmins.map((admin) => (
            <div 
              key={admin.id} 
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
            >
              <div>
                {/* Role / Initials Header & Edit/Delete buttons */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                      {admin.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{admin.name}</h3>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider leading-none block mt-0.5">
                        {admin.role === 'sub_admin' ? 'Sub Admin / Vendor' : 'Super Admin'}
                      </span>
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartEdit(admin)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Vendor Details"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleConfirmDelete(admin)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Vendor Account"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Details Info List */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    <span className="truncate">{admin.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <span>{admin.phone || 'No phone registered'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span>Registered: {new Date(admin.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Assigned Store */}
                  <div className="flex items-center gap-2 pt-1 border-t border-dashed border-slate-100 mt-2">
                    <Shield size={14} className="text-slate-400" />
                    <span className="font-semibold">
                      Store:{' '}
                      {admin.assignedStore ? (
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-[10px] font-bold inline-block border border-indigo-100">
                          {admin.assignedStore.store_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None Assigned</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Approve / Suspend Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                {admin.status === 'inactive' ? (
                  <button
                    onClick={() => handleUpdateSubAdminStatus(admin.id, 'active')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} />
                    Approve & Activate Account
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateSubAdminStatus(admin.id, 'inactive')}
                    className="w-full bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-100 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X size={14} />
                    Suspend Vendor Account
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
          <Shield className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 mt-3">No Sub-Admins Found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no sub-admin or vendor accounts in this section at the moment.</p>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden transform transition-all scale-100 p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Edit Vendor Profile</h3>
              <button 
                onClick={() => setEditingVendor(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateVendor} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Vendor Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs text-slate-700 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs text-slate-700 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +919999999999"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs text-slate-700 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Account Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs text-slate-700 transition-all bg-white"
                >
                  <option value="inactive">Pending Approval (Inactive)</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Assign Dark Store / Vendor Hub
                </label>
                <select
                  value={editForm.storeId}
                  onChange={(e) => setEditForm(prev => ({ ...prev, storeId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs text-slate-700 transition-all bg-white"
                >
                  <option value="">None (Unassigned)</option>
                  {stores.map(st => (
                    <option key={st.id} value={st.id}>{st.store_name} ({st.address})</option>
                  ))}
                </select>
              </div>

              {editForm.storeId && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Store Permissions
                  </span>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={editForm.manageInventory}
                        onChange={(e) => setEditForm(prev => ({ ...prev, manageInventory: e.target.checked }))}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300"
                      />
                      Manage Inventory
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={editForm.viewOrders}
                        onChange={(e) => setEditForm(prev => ({ ...prev, viewOrders: e.target.checked }))}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300"
                      />
                      View Orders
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {editLoading ? (
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden p-6 sm:p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertCircle size={24} className="animate-pulse" />
            </div>
            
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Delete Vendor Account</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to permanently delete the vendor account for <strong className="text-slate-700">"{deletingVendor.name}"</strong>? This action is irreversible.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeletingVendor(null)}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteVendor}
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

    </div>
  );
};

export default Approve;
