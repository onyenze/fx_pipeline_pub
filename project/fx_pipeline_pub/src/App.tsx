import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './lib/auth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MarketingDashboard from './pages/MarketingDashboard';
import TradeDashboard from './pages/TradeDashboard';
import TreasuryDashboard from './pages/TreasuryDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminUserManagement from './pages/adminDashboard';
import TransactionDetails from './pages/TransactionDetails';

// Component to handle default redirects based on user role
function DefaultRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect based on user role
  const role = user?.role?.toLowerCase();
  switch (role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'marketing':
      return <Navigate to="/marketing" replace />;
    case 'trade':
      return <Navigate to="/trade" replace />;
    case 'treasury':
      return <Navigate to="/treasury" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

// Component to handle not found routes
function NotFound() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated but route doesn't exist, redirect to appropriate dashboard
  return <DefaultRedirect />;
}

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  );
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
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
      
      <Route element={<ProtectedRoute allowedRoles={['marketing', 'treasury', 'trade', 'admin']} />}>
        <Route path="/transactions/:id" element={<TransactionDetails />} />
      </Route>
      
      {/* Default redirect for root */}
      <Route path="/" element={<DefaultRedirect />} />
      
      {/* Catch-all route for undefined paths */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AppRoutes />
        <Toaster position="top-right" />
      </div>
    </AuthProvider>
  );
}

export default App;