
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import JobsList from "@/components/jobs/JobsList";
import SkillsManager from "@/components/skills/SkillsManager";
import ApplicationsList from "@/components/applications/ApplicationsList";
import QuizList from "@/components/quizzes/QuizList";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { LogOut, PlusCircle } from "lucide-react";

const EmployeeDashboard = () => {
  const { userProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("jobs");
  const [tabsError, setTabsError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      fetchAvailableJobs();
    }
  }, [userProfile]);

  const fetchAvailableJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setJobs(data || []);
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast({
        title: "Error fetching jobs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    try {
      setTabsError(null);
      setActiveTab(value);
    } catch (error: any) {
      console.error("Error changing tab:", error);
      setTabsError("There was an error loading this section. Please try again.");
    }
  };

  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card>
          <CardContent className="py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading profile information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <p className="text-gray-600">Welcome back, {userProfile?.first_name} {userProfile?.last_name}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/manage-skills" className="flex items-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              Manage Skills
            </Link>
          </Button>
          <Button variant="outline" onClick={signOut} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {tabsError && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-md">
          {tabsError}
          <Button 
            variant="outline" 
            className="ml-4"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      )}

      <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="jobs">Available Jobs</TabsTrigger>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="quizzes">My Quizzes</TabsTrigger>
          <TabsTrigger value="skills">My Skills</TabsTrigger>
        </TabsList>
        
        <TabsContent value="jobs">
          <JobsList
            jobs={jobs}
            loading={loading}
            isEmployee={true}
            emptyMessage="There are no active job listings at the moment."
          />
        </TabsContent>
        
        <TabsContent value="applications">
          <ApplicationsList />
        </TabsContent>
        
        <TabsContent value="quizzes">
          <QuizList />
        </TabsContent>
        
        <TabsContent value="skills">
          <ErrorBoundary fallback={<SkillsLoadError />}>
            <div className="mb-4">
              <Button asChild variant="outline">
                <Link to="/manage-skills">Full Skills Manager</Link>
              </Button>
            </div>
            <SkillsManager />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Simple error boundary component for handling potential errors in tab content
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallback: React.ReactNode;
}> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: any, info: any) {
    console.error("Component error:", error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Fallback component for skills tab errors
const SkillsLoadError = () => (
  <Card>
    <CardContent className="py-8 text-center">
      <h3 className="text-lg font-medium mb-2">Unable to load skills</h3>
      <p className="mb-4">There was a problem loading your skills information.</p>
      <Button onClick={() => window.location.reload()}>
        Reload Page
      </Button>
    </CardContent>
  </Card>
);

export default EmployeeDashboard;
