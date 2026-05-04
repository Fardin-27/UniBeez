import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { NotificationProvider } from "./context/NotificationContext";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MarketplacePage from "./pages/MarketplacePage";
import ProductDetailsPage from "./pages/ProductDetailsPage";

// Authenticated pages
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";

// Seller pages
import SellerDashboard from "./pages/SellerDashboard";
import CreateProductPage from "./pages/CreateProductPage";
import EditProductPage from "./pages/EditProductPage";
import MyProductsPage from "./pages/MyProductsPage";
import SellerOrdersPage from "./pages/SellerOrdersPage";

// Service pages (Module 2)
import ServicesMarketplacePage from "./pages/ServicesMarketplacePage";
import ServiceDetailsPage from "./pages/ServiceDetailsPage";
import CreateServicePage from "./pages/CreateServicePage";
import EditServicePage from "./pages/EditServicePage";
import MyServicesPage from "./pages/MyServicesPage";
import ServiceBookingsPage from "./pages/ServiceBookingsPage";
import ManageTimeSlotsPage from "./pages/ManageTimeSlotsPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import MessagesPage from "./pages/MessagesPage";
import ActivityHistoryPage from "./pages/ActivityHistoryPage";
import DisputesPage from "./pages/DisputesPage";
import NotificationsPage from "./pages/NotificationsPage";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminFlaggedPage from "./pages/AdminFlaggedPage";
import AdminActivityPage from "./pages/AdminActivityPage";
import AdminMonitoringPage from "./pages/AdminMonitoringPage";

const App: React.FC = () => {
  const productOwnerRoles = ["buyer", "seller"];

  return (
    <AuthProvider>
      <Router>
        <NotificationProvider>
        <CartProvider>
          <Routes>
            <Route element={<MainLayout />}>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/products/:id" element={<ProductDetailsPage />} />

              {/* Authenticated routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />

              {/* Seller routes */}
              <Route path="/seller/dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
              <Route path="/products/create" element={<ProtectedRoute roles={productOwnerRoles}><CreateProductPage /></ProtectedRoute>} />
              <Route path="/products/:id/edit" element={<ProtectedRoute roles={productOwnerRoles}><EditProductPage /></ProtectedRoute>} />
              <Route path="/my-products" element={<ProtectedRoute roles={productOwnerRoles}><MyProductsPage /></ProtectedRoute>} />
              <Route path="/seller/orders" element={<ProtectedRoute><SellerOrdersPage /></ProtectedRoute>} />

              {/* Service routes (Module 2) */}
              <Route path="/services" element={<ServicesMarketplacePage />} />
              <Route path="/services/create" element={<ProtectedRoute><CreateServicePage /></ProtectedRoute>} />
              <Route path="/services/:serviceId/edit" element={<ProtectedRoute><EditServicePage /></ProtectedRoute>} />
              <Route path="/services/:serviceId" element={<ServiceDetailsPage />} />
              <Route path="/my-services" element={<ProtectedRoute><MyServicesPage /></ProtectedRoute>} />
              <Route path="/service-bookings" element={<ProtectedRoute><ServiceBookingsPage /></ProtectedRoute>} />
              <Route path="/services/:serviceId/manage-slots" element={<ProtectedRoute><ManageTimeSlotsPage /></ProtectedRoute>} />
              <Route path="/my-bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
              <Route path="/activity-history" element={<ProtectedRoute><ActivityHistoryPage /></ProtectedRoute>} />
              <Route path="/disputes" element={<ProtectedRoute><DisputesPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><AdminUsersPage /></ProtectedRoute>} />
              <Route path="/admin/flagged" element={<ProtectedRoute roles={["admin"]}><AdminFlaggedPage /></ProtectedRoute>} />
              <Route path="/admin/activity" element={<ProtectedRoute roles={["admin"]}><AdminActivityPage /></ProtectedRoute>} />
              <Route path="/admin/monitoring" element={<ProtectedRoute roles={["admin"]}><AdminMonitoringPage /></ProtectedRoute>} />

              {/* 404 */}
              <Route path="*" element={
                <div className="min-h-[60vh] flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-7xl font-extrabold bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">404</h1>
                    <p className="text-slate-400 mt-3 text-lg">Page not found</p>
                    <a href="/" className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-brand-50 text-brand-600 font-semibold rounded-xl hover:bg-brand-100 transition-colors text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                      Back to Home
                    </a>
                  </div>
                </div>
              } />
            </Route>
          </Routes>
        </CartProvider>
        </NotificationProvider>
      </Router>
    </AuthProvider>
  );
};

export default App;
