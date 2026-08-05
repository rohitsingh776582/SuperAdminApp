import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import Dashboard from '../pages/Dashboard';
import Approve from '../pages/Approve';
import Users from '../pages/Users';
import Settings from '../pages/Settings';
import Stores from '../pages/Stores';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import Banners from '../pages/Banners';
import USPs from '../pages/USPs';
import ProductReviews from '../pages/ProductReviews';
import Offers from '../pages/Offers';
import DeliverySettings from '../pages/DeliverySettings';

function UserRoutes() {
  const token = localStorage.getItem('adminToken');

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/forgot-password" element={token ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />

      {/* Protected Layout & Pages */}
      <Route path="/" element={token ? <AdminLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="approve" element={<Approve />} />
        <Route path="users" element={<Users />} />
        <Route path="stores" element={<Stores />} />
        <Route path="settings" element={<Settings />} />
        <Route path="banners" element={<Banners />} />
        <Route path="usp" element={<USPs />} />
        <Route path="reviews" element={<ProductReviews />} />
        <Route path="offers" element={<Offers />} />
        <Route path="delivery-settings" element={<DeliverySettings />} />
        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default UserRoutes;
