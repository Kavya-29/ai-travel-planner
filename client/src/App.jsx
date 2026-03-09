import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import './i18n';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GuestDashboard from './pages/GuestDashboard';
import MyBookingsPage from './pages/MyBookingsPage';
import OwnerDashboard from './pages/OwnerDashboard';
import BookNowPage from './pages/BookNowPage';
import AddPropertyPage from './pages/AddPropertyPage';
import OwnerBookingsPage from './pages/OwnerBookingsPage';
import EditPropertyPage from './pages/EditPropertyPage';
import BookingConfirmPage from './pages/BookingConfirmPage';
import TravelPlannerPage from './pages/TravelPlannerPage';
import TripResultPage from './pages/TripResultPage';
import SquadRoomPage from './pages/SquadRoomPage';
import VerifyOTPPage from './pages/VerifyOTPPage';
import AirplaneChatbot from './components/AirplaneChatbot';
import { ChatProvider } from './context/ChatContext';

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Toaster position="top-right" />
        <Router>
          <div className="min-h-screen bg-slate-900">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-otp" element={<VerifyOTPPage />} />

              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute allowedRoles={['guest']}>
                    <MyBookingsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['guest']}>
                    <GuestDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/planner"
                element={
                  <ProtectedRoute allowedRoles={['guest']}>
                    <TravelPlannerPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/trip-plan"
                element={
                  <ProtectedRoute allowedRoles={['guest']}>
                    <TripResultPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/squad/:id"
                element={
                  <ProtectedRoute allowedRoles={['guest']}>
                    <SquadRoomPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/owner-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="/book-now" element={<BookNowPage />} />

              <Route
                path="/owner/add-property"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <AddPropertyPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/owner/edit-property/:id"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <EditPropertyPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/owner/bookings"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerBookingsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <AirplaneChatbot />
          </div>
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
