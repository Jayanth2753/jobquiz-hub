
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

const EmployeeDashboard = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("jobs");

  useEffect(() => {
    fetchAvailableJobs();
  }, []);

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
      toast({
        title: "Error fetching jobs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Employee Dashboard</h1>
        <p className="text-gray-600">Welcome back, {userProfile?.first_name} {userProfile?.last_name}</p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
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
          <SkillsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeDashboard;
