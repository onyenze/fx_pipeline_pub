import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// Component to handle authentication required for protected routes
function RequireAuth({ children }: { children: React.JSX.Element }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
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
      
      {/* Protected routes - wrapped with RequireAuth */}
      <Route path="/marketing" element={
        <RequireAuth>
          <ProtectedRoute allowedRoles={['marketing', 'treasury']}>
            <MarketingDashboard />
          </ProtectedRoute>
        </RequireAuth>
      } />
      
      <Route path="/admin" element={
        <RequireAuth>
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUserManagement />
          </ProtectedRoute>
        </RequireAuth>
      } />
      
      <Route path="/trade" element={
        <RequireAuth>
          <ProtectedRoute allowedRoles={['trade']}>
            <TradeDashboard />
          </ProtectedRoute>
        </RequireAuth>
      } />
      
      <Route path="/treasury" element={
        <RequireAuth>
          <ProtectedRoute allowedRoles={['treasury']}>
            <TreasuryDashboard />
          </ProtectedRoute>
        </RequireAuth>
      } />
      
      <Route path="/transactions/:id" element={
        <RequireAuth>
          <ProtectedRoute allowedRoles={['marketing', 'treasury', 'trade', 'admin']}>
            <TransactionDetails />
          </ProtectedRoute>
        </RequireAuth>
      } />
      
      {/* Default redirect for root */}
      <Route path="/" element={<DefaultRedirect />} />
      
      {/* Catch-all route for undefined paths */}
      <Route path="*" element={<DefaultRedirect />} />
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