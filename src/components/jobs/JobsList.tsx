
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import JobPostForm from "./JobPostForm";
import JobSkillsList from "./JobSkillsList";

interface JobsListProps {
  jobs: any[];
  loading: boolean;
  isEmployee?: boolean;
  emptyMessage?: string;
  onJobUpdated?: () => void;
}

const JobsList: React.FC<JobsListProps> = ({
  jobs,
  loading,
  isEmployee = false,
  emptyMessage = "No jobs found.",
  onJobUpdated
}) => {
  const { userProfile } = useAuth();
  const [editingJob, setEditingJob] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [jobActionLoading, setJobActionLoading] = useState<string | null>(null);

  const handleApplyToJob = async (jobId: string) => {
    try {
      setJobActionLoading(jobId);
      
      // Check if user has already applied
      const { data: existingApplications, error: checkError } = await supabase
        .from("applications")
        .select("*")
        .eq("job_id", jobId)
        .eq("employee_id", userProfile.id);
      
      if (checkError) throw checkError;
      
      if (existingApplications && existingApplications.length > 0) {
        toast({
          title: "Already Applied",
          description: "You have already applied to this job.",
        });
        return;
      }
      
      // Create new application
      const { error } = await supabase
        .from("applications")
        .insert({
          job_id: jobId,
          employee_id: userProfile.id
        });
      
      if (error) throw error;
      
      // Create a quiz for this application
      await createQuizForApplication(jobId);
      
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully. Check the Quizzes tab to take your skills assessment.",
      });
    } catch (error: any) {
      toast({
        title: "Error Applying",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJobActionLoading(null);
    }
  };

  const createQuizForApplication = async (jobId: string) => {
    try {
      // Get the latest application
      const { data: applications, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("job_id", jobId)
        .eq("employee_id", userProfile.id)
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (appError) throw appError;
      if (!applications || applications.length === 0) return;
      
      const applicationId = applications[0].id;
      
      // Create quiz
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          application_id: applicationId,
          employee_id: userProfile.id
        })
        .select();
      
      if (quizError) throw quizError;
      
      // Generate quiz questions based on matching skills
      await generateQuizQuestions(jobId, quiz[0].id);
    } catch (error: any) {
      console.error("Error creating quiz:", error);
    }
  };

  const generateQuizQuestions = async (jobId: string, quizId: string) => {
    try {
      // Get job skills
      const { data: jobSkills, error: jobSkillsError } = await supabase
        .from("job_skills")
        .select("skill_id")
        .eq("job_id", jobId);
      
      if (jobSkillsError) throw jobSkillsError;
      
      // Get employee skills
      const { data: employeeSkills, error: empSkillsError } = await supabase
        .from("employee_skills")
        .select("skill_id")
        .eq("employee_id", userProfile.id);
      
      if (empSkillsError) throw empSkillsError;
      
      // Find matching skills
      const jobSkillIds = jobSkills.map(item => item.skill_id);
      const empSkillIds = employeeSkills.map(item => item.skill_id);
      const matchingSkillIds = jobSkillIds.filter(id => empSkillIds.includes(id));
      
      // If there are no matching skills, use job skills
      const skillIdsToUse = matchingSkillIds.length > 0 ? matchingSkillIds : jobSkillIds;
      
      if (skillIdsToUse.length === 0) {
        // No skills at all, create a general question
        const { error } = await supabase
          .from("quiz_questions")
          .insert({
            quiz_id: quizId,
            question: "Why do you think you're a good fit for this role?",
            options: JSON.stringify([
              "I have relevant experience",
              "I'm a fast learner",
              "I'm passionate about this field",
              "I have transferable skills"
            ]),
            correct_answer: "I have relevant experience"
          });
        
        if (error) throw error;
        return;
      }
      
      // Get details of the skills to use
      const { data: skillsDetails, error: skillsError } = await supabase
        .from("skills")
        .select("*")
        .in("id", skillIdsToUse);
      
      if (skillsError) throw skillsError;
      
      // Create questions for each matching skill
      for (const skill of skillsDetails) {
        const questionText = `Which best describes your experience with ${skill.name}?`;
        
        const { error } = await supabase
          .from("quiz_questions")
          .insert({
            quiz_id: quizId,
            skill_id: skill.id,
            question: questionText,
            options: JSON.stringify([
              "Beginner - I have basic knowledge",
              "Intermediate - I can work independently",
              "Advanced - I can mentor others",
              "Expert - I have deep expertise"
            ]),
            correct_answer: "Advanced - I can mentor others" // Default correct answer
          });
        
        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Error generating quiz questions:", error);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      setJobActionLoading(jobId);
      
      const { error } = await supabase
        .from("jobs")
        .update({ is_active: !currentStatus })
        .eq("id", jobId);
      
      if (error) throw error;
      
      if (onJobUpdated) onJobUpdated();
      
      toast({
        title: "Job Status Updated",
        description: `Job is now ${!currentStatus ? "active" : "inactive"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error Updating Job",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJobActionLoading(null);
    }
  };

  const handleJobUpdated = () => {
    setEditingJob(null);
    if (onJobUpdated) onJobUpdated();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  if (editingJob) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Job</CardTitle>
          <CardDescription>Update your job listing</CardDescription>
        </CardHeader>
        <CardContent>
          <JobPostForm
            jobData={editingJob}
            onJobCreated={handleJobUpdated}
            onCancel={() => setEditingJob(null)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {jobs.map((job) => (
        <Card key={job.id} className={`shadow-sm ${!job.is_active ? 'opacity-70' : ''}`}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{job.title}</CardTitle>
                <CardDescription className="mt-1">
                  {job.location ? job.location : ''}
                  {job.location && job.is_remote ? ' • ' : ''}
                  {job.is_remote && 'Remote'}
                </CardDescription>
              </div>
              {!job.is_active && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <JobSkillsList jobId={job.id} />
            </div>
            <div className="line-clamp-3 text-sm">
              {job.description}
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Dialog open={isDialogOpen && selectedJob?.id === job.id} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setSelectedJob(null);
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => {
                  setSelectedJob(job);
                  setIsDialogOpen(true);
                }}>
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{job.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <p>{job.location || 'Not specified'} {job.is_remote && '(Remote)'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Required Skills</h3>
                    <JobSkillsList jobId={job.id} />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <div className="whitespace-pre-line text-sm mt-1">
                      {job.description}
                    </div>
                  </div>
                  
                  {isEmployee && (
                    <div className="pt-4">
                      <Button 
                        className="w-full" 
                        onClick={() => handleApplyToJob(job.id)}
                        disabled={!!jobActionLoading}
                      >
                        {jobActionLoading === job.id ? (
                          <span className="flex items-center">
                            <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                            Applying...
                          </span>
                        ) : (
                          "Apply for this Job"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            {!isEmployee && (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingJob(job)}
                >
                  Edit
                </Button>
                <Button 
                  variant={job.is_active ? "destructive" : "default"}
                  onClick={() => toggleJobStatus(job.id, job.is_active)}
                  disabled={!!jobActionLoading}
                >
                  {jobActionLoading === job.id ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      Updating...
                    </span>
                  ) : (
                    job.is_active ? "Deactivate" : "Activate"
                  )}
                </Button>
              </div>
            )}
            
            {isEmployee && (
              <Button 
                onClick={() => handleApplyToJob(job.id)}
                disabled={!!jobActionLoading}
              >
                {jobActionLoading === job.id ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                    Applying...
                  </span>
                ) : (
                  "Apply"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default JobsList;
