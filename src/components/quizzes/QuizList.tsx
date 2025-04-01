
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate, useLocation } from "react-router-dom";
import QuizTaker from "./QuizTaker";
import SkillBasedQuizCreator from "./SkillBasedQuizCreator";

interface Quiz {
  id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  score: number | null;
  application_id: string | null;
  quiz_questions_count?: number;
  applications?: {
    jobs?: {
      title?: string;
    } | null;
  } | null;
}

interface QuizListProps {
  showPracticeQuizzes?: boolean;
}

const QuizList: React.FC<QuizListProps> = ({ showPracticeQuizzes = false }) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createQuizDialogOpen, setCreateQuizDialogOpen] = useState(false);

  useEffect(() => {
    if (userProfile) {
      fetchQuizzes();
    }

    // Check if we should show practice quizzes tab from URL
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab === 'practice-quizzes' && !showPracticeQuizzes) {
      // We're on the dashboard but need to show practice quizzes
      const tabsElement = document.querySelector('[value="practice-quizzes"]') as HTMLElement;
      if (tabsElement) {
        tabsElement.click();
      }
    }
  }, [userProfile, showPracticeQuizzes, location]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      
      if (showPracticeQuizzes) {
        // Fetch practice quizzes (those created without an application_id)
        const { data, error } = await supabase
          .from("quizzes")
          .select(`
            *,
            quiz_questions(count)
          `)
          .is("application_id", null)
          .eq("employee_id", userProfile.id)
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        console.log("Practice quizzes fetched:", data);
        setQuizzes(data || []);
      } else {
        // Fetch job-related quizzes
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
            ),
            quiz_questions(count)
          `)
          .in("application_id", applicationIds)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setQuizzes(data || []);
      }
    } catch (error: any) {
      console.error("Error fetching quizzes:", error);
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

  const handleCreateQuizComplete = () => {
    fetchQuizzes();
    setCreateQuizDialogOpen(false);
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

  return (
    <div className="space-y-6">
      {showPracticeQuizzes && (
        <div className="flex justify-end mb-4">
          <Dialog open={createQuizDialogOpen} onOpenChange={setCreateQuizDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                Create Practice Quiz
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Practice Quiz</DialogTitle>
              </DialogHeader>
              <SkillBasedQuizCreator onComplete={handleCreateQuizComplete} />
            </DialogContent>
          </Dialog>
        </div>
      )}
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedQuiz?.applications?.jobs?.title 
                ? `${selectedQuiz.applications.jobs.title} - Skills Assessment`
                : 'Practice Skills Assessment'}
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

      {quizzes.length === 0 ? (
        <div className="text-center py-8 space-y-4">
          <p className="text-lg text-gray-500">
            {showPracticeQuizzes 
              ? "You don't have any practice quizzes yet." 
              : "You don't have any job quizzes assigned yet. Apply for a job to get a skills assessment."}
          </p>
          {showPracticeQuizzes && (
            <Button onClick={() => setCreateQuizDialogOpen(true)}>
              Create Practice Quiz
            </Button>
          )}
        </div>
      ) : (
        quizzes.map((quiz) => {
          // Add a null check for nested objects
          const jobTitle = quiz.applications?.jobs?.title || 'Practice Quiz';
          const questionCount = quiz.quiz_questions_count || 0;
          
          return (
            <Card key={quiz.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>
                    {jobTitle} - Skills Assessment
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {new Date(quiz.created_at).toLocaleDateString()}
                    {questionCount > 0 && ` • ${questionCount} questions`}
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
                        Completed on: {quiz.completed_at ? new Date(quiz.completed_at).toLocaleDateString() : 'N/A'}
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
          );
        })
      )}
    </div>
  );
};

export default QuizList;
