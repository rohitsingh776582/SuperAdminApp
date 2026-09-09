import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import Approve from '../pages/Approve';
import Stores from '../pages/Stores';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import Banners from '../pages/Banners';
import USPs from '../pages/USPs';
import ProductReviews from '../pages/ProductReviews';
import Orders from '../pages/Orders';
import DeliveredOrders from '../pages/DeliveredOrders';
import CancelledOrders from '../pages/CancelledOrders';
import AddressUsers from '../pages/AddressUsers';

function UserRoutes() {
  const token = localStorage.getItem('adminToken');

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={token ? <Navigate to="/orders" replace /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/orders" replace /> : <Register />} />
      <Route path="/forgot-password" element={token ? <Navigate to="/orders" replace /> : <ForgotPassword />} />

      {/* Protected Layout & Pages */}
      <Route path="/" element={token ? <AdminLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/orders" replace />} />
        <Route path="orders" element={<Orders />} />
        <Route path="delivered-orders" element={<DeliveredOrders />} />
        <Route path="cancelled-orders" element={<CancelledOrders />} />
        <Route path="address-users" element={<AddressUsers />} />
        <Route path="approve" element={<Approve />} />
        <Route path="stores" element={<Stores />} />
        <Route path="banners" element={<Banners />} />
        <Route path="usp" element={<USPs />} />
        <Route path="reviews" element={<ProductReviews />} />
        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/orders" replace />} />
      </Route>
    </Routes>
  );
}

export default UserRoutes;
