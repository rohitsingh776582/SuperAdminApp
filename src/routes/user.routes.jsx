import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

// Pages are code-split: each one is downloaded only when its route is first visited
const Approve = lazy(() => import('../pages/Approve'));
const Stores = lazy(() => import('../pages/Stores'));
const Login = lazy(() => import('../pages/Login'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const Banners = lazy(() => import('../pages/Banners'));
const USPs = lazy(() => import('../pages/USPs'));
const ProductReviews = lazy(() => import('../pages/ProductReviews'));
const Orders = lazy(() => import('../pages/Orders'));
const DeliveredOrders = lazy(() => import('../pages/DeliveredOrders'));
const CancelledOrders = lazy(() => import('../pages/CancelledOrders'));
const AddressUsers = lazy(() => import('../pages/AddressUsers'));
const DeliverySettings = lazy(() => import('../pages/DeliverySettings'));

// Per-route Suspense keeps the admin layout (sidebar/navbar) on screen while a page chunk loads
const page = (element) => <Suspense fallback={null}>{element}</Suspense>;

function UserRoutes() {
  const token = localStorage.getItem('adminToken');

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={token ? <Navigate to="/orders" replace /> : page(<Login />)} />
      <Route path="/forgot-password" element={token ? <Navigate to="/orders" replace /> : page(<ForgotPassword />)} />

      {/* Protected Layout & Pages */}
      <Route path="/" element={token ? <AdminLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/orders" replace />} />
        <Route path="orders" element={page(<Orders />)} />
        <Route path="delivered-orders" element={page(<DeliveredOrders />)} />
        <Route path="cancelled-orders" element={page(<CancelledOrders />)} />
        <Route path="address-users" element={page(<AddressUsers />)} />
        <Route path="approve" element={page(<Approve />)} />
        <Route path="stores" element={page(<Stores />)} />
        <Route path="delivery-charges" element={page(<DeliverySettings />)} />
        <Route path="banners" element={page(<Banners />)} />
        <Route path="usp" element={page(<USPs />)} />
        <Route path="reviews" element={page(<ProductReviews />)} />
        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/orders" replace />} />
      </Route>
    </Routes>
  );
}

export default UserRoutes;
