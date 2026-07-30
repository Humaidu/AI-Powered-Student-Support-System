import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const StudentRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f8f9ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#00355f] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#00355f]">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const AdminRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f8f9ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#00355f] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#00355f]">Verifying administrative access...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
