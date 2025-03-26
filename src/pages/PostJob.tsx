
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import JobPostForm from "@/components/jobs/JobPostForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

const PostJob = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole !== "employer") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleJobCreated = () => {
    toast({
      title: "Success",
      description: "Job posted successfully!",
    });
    navigate("/dashboard");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="p-0 mb-4">
          <Link to="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Post a New Job</h1>
        <p className="text-gray-600 mt-2">
          Create a new job listing to find qualified candidates.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Fill in the details to create a new job listing</CardDescription>
        </CardHeader>
        <CardContent>
          <JobPostForm 
            onJobCreated={handleJobCreated} 
            onCancel={() => navigate("/dashboard")} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PostJob;
