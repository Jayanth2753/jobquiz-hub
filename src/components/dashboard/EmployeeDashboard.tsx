
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, Check, Brain } from "lucide-react";
import JobsList from "@/components/jobs/JobsList";
import ApplicationsList from "@/components/applications/ApplicationsList";
import QuizList from "@/components/quizzes/QuizList";
import { supabase } from "@/integrations/supabase/client";

const EmployeeDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [practiceQuizzes, setPracticeQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);

  useEffect(() => {
    fetchJobs();
    fetchPracticeQuizzes();
  }, []);

  const fetchJobs = async () => {
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
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPracticeQuizzes = async () => {
    if (!userProfile?.id) return;
    
    try {
      setLoadingQuizzes(true);
      
      // Fetch quizzes that are not associated with a job application
      // This will get practice quizzes by looking for quizzes without a matching application
      const { data, error } = await supabase
        .from("quizzes")
        .select(`
          *,
          quiz_questions(count)
        `)
        .is("applications.id", null)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setPracticeQuizzes(data || []);
    } catch (error) {
      console.error("Error fetching practice quizzes:", error);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {userProfile?.first_name}!</h1>
        <p className="text-muted-foreground">
          Manage your job applications and skill assessments all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Briefcase className="mr-2 h-5 w-5" />
              Browse Jobs
            </CardTitle>
            <CardDescription>Find your next opportunity</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Explore job postings that match your skills and experience.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="secondary" className="w-full justify-between">
              <Link to="/dashboard">
                Browse Jobs <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Check className="mr-2 h-5 w-5" />
              Manage Skills
            </CardTitle>
            <CardDescription>Update your skill profile</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Add and update your professional skills to improve job matching.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="secondary" className="w-full justify-between">
              <Link to="/manage-skills">
                Manage Skills <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-primary/5 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-primary">
              <Brain className="mr-2 h-5 w-5" />
              Practice Quizzes
            </CardTitle>
            <CardDescription>Test your skills</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Take quizzes based on your skills and proficiency levels to practice and improve.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full justify-between">
              <Link to="/dashboard?tab=practice-quizzes">
                Take Quiz <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="jobs">Available Jobs</TabsTrigger>
          <TabsTrigger value="quizzes">Job Assessments</TabsTrigger>
          <TabsTrigger value="practice-quizzes">Practice Quizzes</TabsTrigger>
        </TabsList>
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <CardDescription>Track all your job applications</CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationsList />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Available Jobs</CardTitle>
              <CardDescription>Browse and apply for jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <JobsList 
                jobs={jobs} 
                loading={loading} 
                isEmployee={true} 
                emptyMessage="No jobs available at the moment." 
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="quizzes">
          <Card>
            <CardHeader>
              <CardTitle>Job Assessments</CardTitle>
              <CardDescription>View and complete your job skills assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <QuizList showPracticeQuizzes={false} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="practice-quizzes">
          <Card>
            <CardHeader>
              <CardTitle>Practice Quizzes</CardTitle>
              <CardDescription>Take quizzes based on your skills</CardDescription>
            </CardHeader>
            <CardContent>
              <QuizList showPracticeQuizzes={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeDashboard;
