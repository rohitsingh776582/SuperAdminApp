import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Search,
  RefreshCw,
  Eye,
  CreditCard,
  MapPin,
  User,
  PackageCheck,
  DollarSign,
  AlertCircle,
  Truck,
  Store
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

const getGoogleMapsUrl = (addr) => {
  if (!addr) return '';
  const lat = addr.latitude || addr.lat;
  const lng = addr.longitude || addr.lng || addr.long;

  if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const parts = [];
  if (addr.house_no && addr.house_no !== 'House / Flat') parts.push(addr.house_no);
  const area = addr.address_line || addr.area;
  if (area) parts.push(area);
  if (addr.landmark) parts.push(`Near ${addr.landmark}`);
  if (addr.city) parts.push(addr.city);
  if (addr.state) parts.push(addr.state);
  parts.push('India');
  const pincode = addr.pin_code || addr.pincode || addr.postal_code;
  if (pincode) parts.push(pincode);

  const query = parts.filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

export default function DeliveredOrders() {
  const { selectedStoreId, selectedStore } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchDeliveredOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();

      if (paymentMethodFilter !== 'all') params.append('payment_method', paymentMethodFilter);
      if (paymentStatusFilter !== 'all') params.append('payment_status', paymentStatusFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const url = selectedStoreId
        ? `${API_URL}/api/super-admin/store/${selectedStoreId}/orders/delivered${queryString}`
        : `${API_URL}/api/orders?status=delivered${queryString ? '&' + queryString.slice(1) : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setOrders(data.orders || data.data || []);
      } else {
        setError(data.message || 'Failed to fetch delivered orders.');
      }
    } catch (err) {
      console.error('Error fetching delivered orders:', err);
      setError('Network error loading delivered orders list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveredOrders();
  }, [selectedStoreId, paymentMethodFilter, paymentStatusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDeliveredOrders();
  };

  // Metrics
  const totalDelivered = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.final_amount || o.total_amount || 0), 0);
  const codRevenue = orders
    .filter(o => (o.payment_method || '').toLowerCase().includes('cod'))
    .reduce((sum, o) => sum + Number(o.final_amount || o.total_amount || 0), 0);
  const onlineRevenue = orders
    .filter(o => !(o.payment_method || '').toLowerCase().includes('cod'))
    .reduce((sum, o) => sum + Number(o.final_amount || o.total_amount || 0), 0);

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            Delivered Orders
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>View successfully delivered orders and completed deliveries</span>
            {selectedStore && (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full text-xs">
                <Store className="w-3 h-3" /> {selectedStore.store_name}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={fetchDeliveredOrders}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Delivered</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalDelivered}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Delivered Value</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{Math.round(totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Online Payments</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{Math.round(onlineRevenue)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">COD Collected</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{Math.round(codRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID (e.g. ORD-1234)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Payment Methods</option>
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="online">Online Payment</option>
            </select>

            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-colors cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Delivered Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
            <p className="text-sm">Loading delivered orders...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No Delivered Orders Found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">No delivered orders found for this Dark Store matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Order ID & Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Delivery Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {orders.map((order) => {
                  const isOnline = (order.payment_method || '').toLowerCase().includes('razorpay') || (order.payment_method || '').toLowerCase().includes('online');
                  const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  });

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white font-mono">{order.order_number}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{dateStr}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {order.customer?.full_name || order.address?.full_name || 'Customer'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {order.customer?.phone_number || order.address?.phone || '-'}
                        </div>
                      </td>

                      <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-500 dark:text-slate-400">
                        {order.address ? (
                          `${order.address.address_line}, ${order.address.city} - ${order.address.pin_code}`
                        ) : 'No address record'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                        {order.order_items?.length || 0} Products
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">₹{order.final_amount || order.total_amount}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          {isOnline ? '💳 Online' : '💵 COD'}
                        </div>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          order.payment_status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {order.payment_status || 'PENDING'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 uppercase tracking-wider inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> DELIVERED
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-6 p-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PackageCheck className="w-6 h-6 text-emerald-500" />
                  Order #{selectedOrder.order_number}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Delivered Order | Placed on {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer & Address */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-500" />
                  Customer Details
                </h3>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {selectedOrder.customer?.full_name || selectedOrder.address?.full_name || 'N/A'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phone: {selectedOrder.customer?.phone_number || selectedOrder.address?.phone || 'N/A'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Email: {selectedOrder.customer?.email || 'N/A'}
                </p>

                <div 
                  onClick={() => {
                    if (selectedOrder.address) {
                      const url = getGoogleMapsUrl(selectedOrder.address);
                      if (url) window.open(url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className={`pt-2 border-t border-slate-200 dark:border-slate-800/80 mt-2 ${selectedOrder.address ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/60 p-2 rounded-lg transition-all' : ''}`}
                  title="Click to view delivery location on Google Maps"
                >
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    Delivery Location
                  </h4>
                  {selectedOrder.address ? (
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedOrder.address.house_no ? `${selectedOrder.address.house_no}, ` : ''}
                      {selectedOrder.address.address_line}
                      {selectedOrder.address.landmark ? `, ${selectedOrder.address.landmark}` : ''}
                      <br />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {selectedOrder.address.city} - {selectedOrder.address.pin_code}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">No detailed address record.</p>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  Payment Summary
                </h3>

                <div className="flex justify-between text-xs py-1">
                  <span className="text-slate-500 dark:text-slate-400">Payment Method</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedOrder.payment_method === 'online_razorpay' ? 'Online Payment' : 'Cash on Delivery (COD)'}
                  </span>
                </div>    

                <div className="flex justify-between text-xs py-1">
                  <span className="text-slate-500 dark:text-slate-400">Payment Status</span>
                  <span className="font-bold uppercase text-emerald-600 dark:text-emerald-400">
                    {selectedOrder.payment_status || 'PAID'}
                  </span>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                    <span className="font-semibold text-slate-900 dark:text-white">₹{selectedOrder.total_amount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Delivery Charge</span>
                    <span className="text-slate-900 dark:text-white">₹{selectedOrder.delivery_charge || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Handling Charge</span>
                    <span className="text-slate-900 dark:text-white">₹{selectedOrder.handling_charge || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Grand Total</span>
                    <span className="text-emerald-600 dark:text-emerald-400">₹{selectedOrder.final_amount || selectedOrder.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Delivered Items ({selectedOrder.order_items?.length || 0})
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {selectedOrder.order_items?.map((item) => {
                  const imgUrl = getImageUrl(item.product_image || item.product?.product_images?.[0]?.image_url);
                  return (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={item.product_name || 'Product'}
                            className="w-12 h-12 object-cover rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xl flex-shrink-0">
                            🥬
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {item.product_name || item.product?.title || 'Product'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            ₹{item.unit_price} × {item.quantity} units
                          </p>
                        </div>
                      </div>
                      <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        ₹{item.total_price || item.unit_price * item.quantity}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
