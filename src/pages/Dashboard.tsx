
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import EmployerDashboard from "@/components/dashboard/EmployerDashboard";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";

const Dashboard = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div>
      {userRole === "employer" && <EmployerDashboard />}
      {userRole === "employee" && <EmployeeDashboard />}
      {!userRole && (
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Loading profile...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
