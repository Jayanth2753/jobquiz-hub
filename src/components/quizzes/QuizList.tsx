
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import QuizTaker from "./QuizTaker";

const QuizList = () => {
  const { userProfile } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (userProfile) {
      fetchQuizzes();
    }
  }, [userProfile]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      
      // First get applications submitted by the employee
      const { data: applications, error: appError } = await supabase
        .from("applications")
        .select("id")
        .eq("employee_id", userProfile.id);
      
      if (appError) throw appError;
      
      if (!applications || applications.length === 0) {
        setQuizzes([]);
        setLoading(false);
        return;
      }
      
      // Get application IDs
      const applicationIds = applications.map(app => app.id);
      
      // Then get quizzes linked to those applications
      const { data, error } = await supabase
        .from("quizzes")
        .select(`
          *,
          applications(
            *,
            jobs(
              id, title
            )
          )
        `)
        .in("application_id", applicationIds)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setQuizzes(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching quizzes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = () => {
    fetchQuizzes();
    setDialogOpen(false);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">
          You don't have any quizzes assigned yet. Apply for a job to get a skills assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedQuiz?.applications?.jobs?.title} - Skills Assessment
            </DialogTitle>
          </DialogHeader>
          {selectedQuiz && (
            <QuizTaker
              quizId={selectedQuiz.id}
              applicationId={selectedQuiz.application_id}
              onComplete={handleQuizComplete}
            />
          )}
        </DialogContent>
      </Dialog>

      {quizzes.map((quiz) => (
        <Card key={quiz.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle>
                {quiz.applications.jobs.title} - Skills Assessment
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Created: {new Date(quiz.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge className={getStatusBadgeColor(quiz.status)}>
              {quiz.status.replace("_", " ").charAt(0).toUpperCase() + quiz.status.replace("_", " ").slice(1)}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quiz.status === "completed" && (
                <div>
                  <p className="text-sm font-medium">Your Score</p>
                  <div className="flex items-center mt-1">
                    <p className="text-xl font-bold">{quiz.score}%</p>
                    <div className="ml-4 flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${quiz.score}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Completed on: {new Date(quiz.completed_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {quiz.status !== "completed" && (
                <Button
                  onClick={() => {
                    setSelectedQuiz(quiz);
                    setDialogOpen(true);
                  }}
                >
                  {quiz.status === "in_progress" ? "Continue Quiz" : "Start Quiz"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuizList;
