
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import ManageSkills from "@/pages/ManageSkills";
import PostJob from "@/pages/PostJob";
import NotFound from "@/pages/NotFound";
import MainLayout from "@/components/layout/MainLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<MainLayout><Index /></MainLayout>} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manage-skills" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ManageSkills />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/post-job" 
              element={
                <ProtectedRoute allowedRoles={["employer"]}>
                  <MainLayout>
                    <PostJob />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
