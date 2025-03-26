
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Upload } from "lucide-react";

interface ApplicationsListProps {
  employer?: boolean;
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  quiz_completed: "bg-blue-100 text-blue-800",
  resume_requested: "bg-purple-100 text-purple-800",
  resume_submitted: "bg-indigo-100 text-indigo-800",
  interview: "bg-green-100 text-green-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800"
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  quiz_completed: "Quiz Completed",
  resume_requested: "Resume Requested",
  resume_submitted: "Resume Submitted",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Rejected"
};

const ApplicationsList: React.FC<ApplicationsListProps> = ({ employer = false }) => {
  const { userProfile } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      fetchApplications();
    }
  }, [userProfile, employer]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("applications")
        .select(`
          *,
          jobs(*),
          quizzes(*),
          profiles:employee_id(first_name, last_name)
        `);

      if (employer) {
        // For employers, get applications for their jobs
        query = query.in(
          'job_id', 
          supabase
            .from('jobs')
            .select('id')
            .eq('employer_id', userProfile.id)
        );
      } else {
        // For employees, get their own applications
        query = query.eq('employee_id', userProfile.id);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setApplications(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching applications",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadResume = async (applicationId: string) => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingId(applicationId);
      
      // Upload to storage
      const filePath = `${userProfile.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, selectedFile);
      
      if (uploadError) throw uploadError;
      
      // Update application with resume URL
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          resume_url: `resumes/${filePath}`,
          status: 'resume_submitted',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);
      
      if (updateError) throw updateError;
      
      fetchApplications();
      setSelectedFile(null);
      
      toast({
        title: "Resume Uploaded",
        description: "Your resume has been uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading resume",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      setUpdatingId(applicationId);
      
      const { error } = await supabase
        .from('applications')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);
      
      if (error) throw error;
      
      fetchApplications();
      
      toast({
        title: "Status Updated",
        description: `Application status updated to ${statusLabels[newStatus]}`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">
          {employer
            ? "You haven't received any applications yet."
            : "You haven't applied to any jobs yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {applications.map((app) => (
        <Card key={app.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle>{app.jobs.title}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {employer 
                  ? `Applicant: ${app.profiles.first_name} ${app.profiles.last_name}`
                  : `Applied: ${new Date(app.created_at).toLocaleDateString()}`
                }
              </p>
            </div>
            <Badge className={statusColors[app.status]}>
              {statusLabels[app.status]}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Quiz Status</p>
                <p className="text-sm">
                  {app.quizzes && app.quizzes.length > 0 
                    ? `${app.quizzes[0].status === 'completed' 
                        ? 'Completed' 
                        : 'Pending'
                      }${app.quizzes[0].score !== null ? ` - Score: ${app.quizzes[0].score}%` : ''}`
                    : 'No quiz assigned'
                  }
                </p>
              </div>
              
              {app.status === 'resume_requested' && !employer && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm font-medium mb-2">Upload Resume</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80"
                    />
                    <Button 
                      onClick={() => handleUploadResume(app.id)}
                      disabled={!selectedFile || uploadingId === app.id}
                      size="sm"
                    >
                      {uploadingId === app.id ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                          Uploading...
                        </span>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {employer && (
                <div className="flex justify-between items-center pt-2">
                  <div>
                    {app.resume_url && app.status !== 'pending' && app.status !== 'quiz_completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const { data, error } = await supabase.storage
                            .from('resumes')
                            .createSignedUrl(app.resume_url.replace('resumes/', ''), 60);
                          
                          if (error) {
                            toast({
                              title: "Error",
                              description: "Could not access resume",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          window.open(data.signedUrl, '_blank');
                        }}
                      >
                        View Resume
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      onValueChange={(value) => handleStatusChange(app.id, value)}
                      defaultValue={app.status}
                      disabled={updatingId === app.id}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="quiz_completed">Quiz Completed</SelectItem>
                        <SelectItem value="resume_requested">Request Resume</SelectItem>
                        <SelectItem value="resume_submitted">Resume Submitted</SelectItem>
                        <SelectItem value="interview">Schedule Interview</SelectItem>
                        <SelectItem value="accepted">Accept</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ApplicationsList;
