import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './lib/auth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MarketingDashboard from './pages/MarketingDashboard';
import TradeDashboard from './pages/TradeDashboard';
import TreasuryDashboard from './pages/TreasuryDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminUserManagement from './pages/adminDashboard'
import TransactionDetails from './pages/TransactionDetails';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/transactions/:id" element={<TransactionDetails />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute allowedRoles={['marketing', 'treasury']} />}>
            <Route path="/marketing" element={<MarketingDashboard />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminUserManagement />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['trade']} />}>
            <Route path="/trade" element={<TradeDashboard />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['treasury']} />}>
            <Route path="/treasury" element={<TreasuryDashboard />} />
          </Route>
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </AuthProvider>
  );
}

export default App;