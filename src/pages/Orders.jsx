import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  RefreshCw,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  CreditCard,
  MapPin,
  User,
  PackageCheck,
  ChevronDown,
  DollarSign,
  AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      let url = `${API_URL}/api/orders?`;
      const params = new URLSearchParams();

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (paymentMethodFilter !== 'all') params.append('payment_method', paymentMethodFilter);
      if (paymentStatusFilter !== 'all') params.append('payment_status', paymentStatusFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      url += params.toString();

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || 'Failed to fetch orders.');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Network error loading orders list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentMethodFilter, paymentStatusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatusId(orderId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        alert(data.message || 'Failed to update order status.');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Network error updating status.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    setUpdatingStatusId(orderId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payment_status: newPaymentStatus })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: newPaymentStatus } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, payment_status: newPaymentStatus }));
        }
      } else {
        alert(data.message || 'Failed to update payment status.');
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert('Network error updating payment status.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Metrics calculation
  const totalOrdersCount = orders.length;
  const pendingCount = orders.filter(o => ['pending', 'placed', 'confirmed'].includes(o.status)).length;
  const inTransitCount = orders.filter(o => ['packed', 'shipped', 'out_for_delivery'].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.payment_status === 'paid' ? Number(o.final_amount || o.total_amount || 0) : 0), 0);

  const getStatusBadge = (status) => {
    const config = {
      pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      placed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      confirmed: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      packed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      out_for_delivery: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      returned: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
    const styleClass = config[status] || 'bg-slate-800 text-slate-300 border-slate-700';
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styleClass} uppercase tracking-wider`}>
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-blue-500" />
            Order Management System
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track, filter, update statuses, and view complete transaction details.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Orders
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-bold text-white mt-1">{totalOrdersCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending Orders</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">In Transit</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{inTransitCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Delivered</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{deliveredCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Paid Revenue</p>
            <p className="text-2xl font-bold text-white mt-1">₹{totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID (e.g. ORD-1234)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {ORDER_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Payment Method Filter */}
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Payment Methods</option>
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="online">Online Payment</option>
            </select>

            {/* Payment Status Filter */}
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="text-sm">Loading orders list...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-400 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-base font-semibold text-slate-200">No Orders Found</p>
            <p className="text-xs text-slate-500">Try adjusting your search terms or status filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Order ID & Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Order Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((order) => {
                  const isOnline = order.payment_method === 'online_razorpay' || order.payment_method === 'online';
                  const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  });

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Order ID & Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-white font-mono">{order.order_number}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{dateStr}</div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-200">
                          {order.customer?.full_name || order.address?.full_name || 'Customer'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {order.customer?.phone_number || order.address?.phone || '-'}
                        </div>
                      </td>

                      {/* Delivery Address Preview */}
                      <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-400">
                        {order.address ? (
                          `${order.address.address_line}, ${order.address.city} - ${order.address.pin_code}`
                        ) : 'No address record'}
                      </td>

                      {/* Line Items Count */}
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-300">
                        {order.order_items?.length || 0} Products
                      </td>

                      {/* Total Amount */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-emerald-400">₹{order.final_amount || order.total_amount}</div>
                      </td>

                      {/* Payment Method & Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          {isOnline ? '💳 Online Payment' : '💵 COD'}
                        </div>
                        <div className="mt-1">
                          <select
                            value={order.payment_status || 'pending'}
                            onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                            className={`text-[11px] font-bold px-2 py-0.5 rounded border focus:outline-none ${order.payment_status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                          >
                            <option value="pending" className="bg-slate-900 text-slate-200">PENDING</option>
                            <option value="paid" className="bg-slate-900 text-slate-200">PAID</option>
                            <option value="failed" className="bg-slate-900 text-slate-200">FAILED</option>
                            <option value="refunded" className="bg-slate-900 text-slate-200">REFUNDED</option>
                          </select>
                        </div>
                      </td>

                      {/* Order Status Selector */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          disabled={updatingStatusId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          {ORDER_STATUS_OPTIONS.filter(o => o.value !== 'all').map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* View Action */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors"
                          title="View Order Details"
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
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-6 p-6 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <PackageCheck className="w-6 h-6 text-blue-500" />
                  Order #{selectedOrder.order_number}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors"
              >
                Close ✕
              </button>
            </div>

            {/* Quick Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer & Address */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-400" />
                  Customer Details
                </h3>
                <p className="text-sm font-semibold text-white">
                  {selectedOrder.customer?.full_name || selectedOrder.address?.full_name || 'N/A'}
                </p>
                <p className="text-xs text-slate-400">
                  Phone: {selectedOrder.customer?.phone_number || selectedOrder.address?.phone || 'N/A'}
                </p>
                <p className="text-xs text-slate-400">
                  Email: {selectedOrder.customer?.email || 'N/A'}
                </p>

                <div className="pt-2 border-t border-slate-800/80 mt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Delivery Address
                  </h4>
                  {selectedOrder.address ? (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedOrder.address.house_no ? `${selectedOrder.address.house_no}, ` : ''}
                      {selectedOrder.address.address_line}
                      {selectedOrder.address.landmark ? `, ${selectedOrder.address.landmark}` : ''}
                      <br />
                      <span className="font-semibold text-white">
                        {selectedOrder.address.city} - {selectedOrder.address.pin_code}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">No detailed address record.</p>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  Payment Summary
                </h3>

                <div className="flex justify-between text-xs py-1">
                  <span className="text-slate-400">Payment Method</span>
                  <span className="font-semibold text-slate-200">
                    {selectedOrder.payment_method === 'online_razorpay' ? 'Online Payment' : 'Cash on Delivery (COD)'}
                  </span>
                </div>    

                <div className="flex justify-between text-xs py-1">
                  <span className="text-slate-400">Payment Status</span>
                  <span className={`font-bold uppercase ${selectedOrder.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedOrder.payment_status}
                  </span>
                </div>

                {selectedOrder.razorpay_order_id && (
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-400">Razorpay Order ID</span>
                    <span className="font-mono text-cyan-400">{selectedOrder.razorpay_order_id}</span>
                  </div>
                )}

                {selectedOrder.razorpay_payment_id && (
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-400">Razorpay Payment ID</span>
                    <span className="font-mono text-cyan-400">{selectedOrder.razorpay_payment_id}</span>
                  </div>
                )}

                <div className="border-t border-slate-800 pt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Subtotal</span>
                    <span>₹{selectedOrder.total_amount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Delivery Charge</span>
                    <span>₹{selectedOrder.delivery_charge || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Handling Charge</span>
                    <span>₹{selectedOrder.handling_charge || 0}</span>
                  </div>
                  {Number(selectedOrder.discount_amount) > 0 && (
                    <div className="flex justify-between text-xs text-emerald-400">
                      <span>Discount Saved</span>
                      <span>-₹{selectedOrder.discount_amount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                    <span>Grand Total</span>
                    <span className="text-emerald-400">₹{selectedOrder.final_amount || selectedOrder.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 font-bold text-xs text-slate-400 uppercase tracking-wider">
                Ordered Products ({selectedOrder.order_items?.length || 0})
              </div>
              <div className="divide-y divide-slate-800">
                {selectedOrder.order_items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {item.product_image || item.product?.product_images?.[0]?.image_url ? (
                        <img
                          src={item.product_image || item.product?.product_images?.[0]?.image_url}
                          alt={item.product_name}
                          className="w-10 h-10 object-cover rounded-lg bg-slate-900"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-lg">
                          🥬
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          {item.product_name || item.product?.title || 'Product'}
                        </p>
                        <p className="text-xs text-slate-400">
                          ₹{item.unit_price} × {item.quantity} units
                        </p>
                      </div>
                    </div>
                    <div className="font-bold text-sm text-white">
                      ₹{item.total_price || item.unit_price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
