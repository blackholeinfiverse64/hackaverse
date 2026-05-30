import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute: isLoading=', isLoading, 'isAuthenticated=', isAuthenticated, 'user=', user, 'requiredRole=', requiredRole);

  if (isLoading) {
    console.log('ProtectedRoute: Showing loading state');
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-purple/30 border-t-primary-purple rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Redirecting to / because not authenticated');
    return <Navigate to="/" state={{ redirectTo: location.pathname }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    console.log('ProtectedRoute: Redirecting because role mismatch. User role:', user?.role, 'Required role:', requiredRole);
    const getCorrectPath = (role) => {
      switch (role) {
        case 'admin': return '/admin';
        case 'judge': return '/judge';
        default: return '/app';
      }
    };
    return <Navigate to={getCorrectPath(user?.role)} replace />;
  }

  console.log('ProtectedRoute: Rendering children');
  return children;
};

export default ProtectedRoute;