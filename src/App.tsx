import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './lib/auth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MarketingDashboard from './pages/MarketingDashboard';
import TradeDashboard from './pages/TradeDashboard';
import TreasuryDashboard from './pages/TreasuryDashboard';
import TransactionDetails from './pages/TransactionDetails';
import ProtectedRoute from './components/ProtectedRoute';
import AdminUserManagement from './pages/adminDashboard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/marketing"
              element={
                <ProtectedRoute allowedRoles={['marketing','treasury']}>
                  <MarketingDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trade"
              element={
                <ProtectedRoute allowedRoles={['trade']}>
                  <TradeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/treasury"
              element={
                <ProtectedRoute allowedRoles={['treasury']}>
                  <TreasuryDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions/:id"
              element={
                <ProtectedRoute allowedRoles={['treasury', 'marketing', 'trade']}>
                  <TransactionDetails />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;