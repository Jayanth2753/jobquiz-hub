
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import JobPostForm from "@/components/jobs/JobPostForm";
import JobsList from "@/components/jobs/JobsList";
import ApplicationsList from "@/components/applications/ApplicationsList";
import { Link } from "react-router-dom";
import { PlusCircle, Database } from "lucide-react";

const EmployerDashboard = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("jobs");

  useEffect(() => {
    fetchEmployerJobs();
  }, []);

  const fetchEmployerJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("employer_id", userProfile?.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setJobs(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching jobs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJobCreated = () => {
    setShowJobForm(false);
    fetchEmployerJobs();
    toast({
      title: "Success",
      description: "Job posted successfully",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Employer Dashboard</h1>
          <p className="text-gray-600">Welcome back, {userProfile?.first_name} {userProfile?.last_name}</p>
        </div>
        <div className="flex gap-2">
          {!showJobForm && activeTab === "jobs" && (
            <Button asChild>
              <Link to="/post-job" className="flex items-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                Post New Job
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/manage-skills" className="flex items-center">
              <Database className="mr-2 h-4 w-4" />
              Manage Skills
            </Link>
          </Button>
        </div>
      </div>

      {showJobForm ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Post a New Job</CardTitle>
            <CardDescription>Fill in the details to create a new job listing</CardDescription>
          </CardHeader>
          <CardContent>
            <JobPostForm onJobCreated={handleJobCreated} onCancel={() => setShowJobForm(false)} />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="jobs">My Job Listings</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="jobs">
            <div className="flex justify-end mb-4">
              <Button asChild>
                <Link to="/post-job">Post New Job</Link>
              </Button>
            </div>
            <JobsList
              jobs={jobs}
              loading={loading}
              emptyMessage="You haven't posted any jobs yet."
              onJobUpdated={fetchEmployerJobs}
            />
          </TabsContent>
          
          <TabsContent value="applications">
            <ApplicationsList employer={true} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default EmployerDashboard;
