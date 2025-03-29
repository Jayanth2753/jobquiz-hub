
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, Check, Sparkles } from "lucide-react";
import JobsList from "@/components/jobs/JobsList";
import ApplicationsList from "@/components/applications/ApplicationsList";
import QuizList from "@/components/quizzes/QuizList";

const EmployeeDashboard: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {userProfile?.first_name}!</h1>
        <p className="text-muted-foreground">
          Manage your job applications and skill assessments all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Quiz
            </CardTitle>
            <CardDescription>Test your skills</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Create a personalized quiz based on your skills and proficiency levels.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="secondary" className="w-full justify-between">
              <Link to="/generate-quiz">
                Generate Quiz <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="jobs">Available Jobs</TabsTrigger>
          <TabsTrigger value="quizzes">Skill Assessments</TabsTrigger>
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
              <JobsList />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="quizzes">
          <Card>
            <CardHeader>
              <CardTitle>Skill Assessments</CardTitle>
              <CardDescription>View and complete your skill assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <QuizList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeDashboard;
