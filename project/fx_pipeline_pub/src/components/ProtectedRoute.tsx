import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role.toLowerCase())) {
    // Redirect to appropriate dashboard based on user role
    const role = user.role.toLowerCase();
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

  // Render the protected component
  return <Outlet />;
};

export default ProtectedRoute;