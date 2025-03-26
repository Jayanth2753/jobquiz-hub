
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import EmployerDashboard from "@/components/dashboard/EmployerDashboard";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user, userRole, loading, userProfile } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    if (user && !userProfile && retryCount < 3) {
      // If user is logged in but profile isn't loaded, try to fetch profile data
      const timer = setTimeout(() => {
        console.log("Retrying profile load...", { user, userRole, userProfile });
        setRetryCount(prev => prev + 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, userProfile, retryCount]);

  // Show detailed loading state
  if (loading || (user && !userProfile && retryCount < 3)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">
          {loading ? "Checking authentication..." : "Loading your profile..."}
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If we still don't have userRole after retries, show error
  if (!userRole && retryCount >= 3) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Unable to load profile</h1>
        <p className="mb-4">We couldn't load your profile information. This might be because:</p>
        <ul className="list-disc text-left max-w-md mx-auto mb-6">
          <li>Your account registration is not complete</li>
          <li>There was a problem with the database connection</li>
          <li>Your account type (employer/employee) is not set</li>
        </ul>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {userRole === "employer" && <EmployerDashboard />}
      {userRole === "employee" && <EmployeeDashboard />}
      {!userRole && (
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Profile type not set</h1>
          <p>Please contact support to fix your account type.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
