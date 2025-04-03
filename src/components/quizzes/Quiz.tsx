
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw } from "lucide-react";

// Consolidated quiz types
export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  skills?: {
    name: string;
  } | null;
}

export interface Quiz {
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

// Loading state component
const QuizLoading = ({ isRefreshing = false }: { isRefreshing?: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-3"></div>
      <p className="text-gray-500">
        {isRefreshing ? "Refreshing questions..." : "Loading quiz questions..."}
      </p>
      <p className="text-sm text-gray-400 mt-2">
        This may take a moment. The system is checking for your questions.
      </p>
    </div>
  );
};

// Empty state component
const QuizEmpty = ({ 
  retryCount, 
  maxRetries, 
  onRefresh,
  isRefreshing = false
}: { 
  retryCount: number; 
  maxRetries: number; 
  onRefresh: () => void;
  isRefreshing?: boolean;
}) => {
  return (
    <div className="text-center py-8 space-y-4">
      <p className="text-lg text-gray-500">
        No questions found for this quiz. The system is still generating your quiz questions.
      </p>
      <div className="flex flex-col items-center justify-center space-y-2">
        <p className="text-sm text-gray-400">
          {retryCount < maxRetries 
            ? `We've tried ${retryCount} times. Auto-retrying in 5 seconds...` 
            : "We've tried several times but couldn't find your questions."}
        </p>
        <p className="text-sm text-gray-400">
          Quiz generation can take up to 1-2 minutes to complete.
        </p>
      </div>
      <Button 
        onClick={onRefresh} 
        className="mt-4"
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Refreshing...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Manually
          </>
        )}
      </Button>
    </div>
  );
};

// Main quiz taker component
export const QuizTaker = ({ 
  quizId, 
  applicationId, 
  onComplete 
}: { 
  quizId: string; 
  applicationId?: string | null; 
  onComplete: () => void; 
}) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [retryInProgress, setRetryInProgress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const maxRetries = 5;

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  const updateQuizStatus = async () => {
    try {
      await supabase
        .from("quizzes")
        .update({ status: "in_progress" })
        .eq("id", quizId);
    } catch (error) {
      console.error("Error updating quiz status:", error);
    }
  };

  const fetchQuizQuestions = async () => {
    try {
      setLoading(true);
      setRetryInProgress(true);
      console.log(`Fetching questions for quiz ID: ${quizId}`);

      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*, skills(name)")
        .eq("quiz_id", quizId);

      if (error) {
        throw error;
      }

      console.log(`Found ${data?.length || 0} questions for quiz ID: ${quizId}`, data);

      // Parse options from JSON string if needed
      const parsedQuestions = (data || []).map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }));

      setQuestions(parsedQuestions);
    } catch (error: any) {
      console.error("Error fetching quiz questions:", error);
      toast({
        title: "Error fetching quiz questions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRetryInProgress(false);
    }
  };

  const handleSubmitQuiz = async () => {
    // Check if all questions are answered
    if (Object.keys(answers).length !== questions.length) {
      toast({
        title: "Incomplete Quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Submit answers and calculate score
      let correctAnswers = 0;

      // Create quiz answers
      for (const question of questions) {
        const userAnswer = answers[question.id];
        const isCorrect = userAnswer === question.correct_answer;
        
        if (isCorrect) correctAnswers++;

        await supabase.from("quiz_answers").insert({
          question_id: question.id,
          answer: userAnswer,
          is_correct: isCorrect,
        });
      }

      // Calculate score as percentage
      const score = Math.round((correctAnswers / questions.length) * 100);

      // Update quiz status and score
      await supabase
        .from("quizzes")
        .update({
          status: "completed",
          score: score,
          completed_at: new Date().toISOString(),
        })
        .eq("id", quizId);

      // Update application status if this is a job quiz
      if (applicationId) {
        await supabase
          .from("applications")
          .update({
            status: "quiz_completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", applicationId);
      }

      toast({
        title: "Quiz Completed",
        description: `You scored ${score}%. Your application has been updated.`,
      });

      onComplete();
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      toast({
        title: "Error submitting quiz",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-retry if no questions are found
  useEffect(() => {
    if (questions.length === 0 && retryCount < maxRetries && !loading && !retryInProgress) {
      const timer = setTimeout(() => {
        console.log(`Auto-retrying to fetch questions (attempt ${retryCount + 1}/${maxRetries})...`);
        setRetryInProgress(true);
        fetchQuizQuestions().finally(() => {
          setRetryInProgress(false);
          setRetryCount(prev => prev + 1);
        });
      }, 5000); // 5 second delay between retries
      
      return () => clearTimeout(timer);
    }
  }, [questions, loading, retryCount, retryInProgress]);

  useEffect(() => {
    fetchQuizQuestions();
  }, [quizId]);

  useEffect(() => {
    updateQuizStatus();
  }, [quizId]);

  if (loading || retryInProgress) {
    return <QuizLoading isRefreshing={retryInProgress} />;
  }

  if (questions.length === 0) {
    return (
      <QuizEmpty 
        retryCount={retryCount} 
        maxRetries={maxRetries} 
        onRefresh={fetchQuizQuestions}
        isRefreshing={retryInProgress}
      />
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Please answer all questions to complete your skills assessment.
      </p>

      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">
                  {index + 1}. {question.question}
                </h3>
                <p className="text-sm text-gray-500">
                  Skill: {question.skills?.name || "Unknown"}
                </p>
              </div>

              <RadioGroup
                value={answers[question.id] || ""}
                onValueChange={(value) => handleAnswerChange(question.id, value)}
              >
                {question.options.map((option: string) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                    <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmitQuiz} 
          disabled={submitting || Object.keys(answers).length !== questions.length}
        >
          {submitting ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
              Submitting...
            </span>
          ) : (
            "Submit Quiz"
          )}
        </Button>
      </div>
    </div>
  );
};

// Combined quiz list component with quiz management
export const QuizManager = ({ 
  showPracticeQuizzes = false 
}: { 
  showPracticeQuizzes?: boolean 
}) => {
  const { userProfile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchQuizzes = async () => {
    if (!userProfile?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch job-related quizzes only (no practice quizzes)
      const { data: applications, error: appError } = await supabase
        .from("applications")
        .select("id")
        .eq("employee_id", userProfile.id);
      
      if (appError) throw appError;
      
      if (!applications || applications.length === 0) {
        setQuizzes([]);
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
            jobs(
              id, title
            )
          ),
          quiz_questions:quiz_questions(count)
        `)
        .in("application_id", applicationIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Quiz interface
      const transformedData = data?.map(quiz => ({
        ...quiz,
        quiz_questions_count: quiz.quiz_questions && quiz.quiz_questions[0] ? quiz.quiz_questions[0].count : 0
      })) || [];
      
      setQuizzes(transformedData);
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

  useEffect(() => {
    if (userProfile?.id) {
      fetchQuizzes();
    }
  }, [userProfile]);

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render empty state
  if (quizzes.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-lg text-gray-500">
          You don't have any job assessments yet. Apply for a job to get a skills assessment.
        </p>
      </div>
    );
  }

  // Render list of quizzes
  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => (
        <Card key={quiz.id} className="overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">
                  {quiz.applications?.jobs?.title || "Untitled Job"}
                </h3>
                <div className="flex items-center mt-1 space-x-3">
                  <span className="text-sm text-gray-500">
                    Created: {new Date(quiz.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      quiz.status === 'completed' ? 'bg-green-500' : 
                      quiz.status === 'in_progress' ? 'bg-amber-500' : 'bg-gray-500'
                    }`}></span>
                    <span className="text-sm capitalize">{quiz.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {quiz.status === 'completed' && quiz.score !== null ? (
                  <div className="text-lg font-semibold">
                    Score: {quiz.score}%
                  </div>
                ) : (
                  <Button 
                    onClick={() => {
                      setSelectedQuiz(quiz);
                      setDialogOpen(true);
                    }}
                    disabled={quiz.quiz_questions_count === 0}
                  >
                    {quiz.status === 'pending' ? 'Start Quiz' : 'Continue Quiz'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Quiz taking dialog */}
      {dialogOpen && selectedQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {selectedQuiz.applications?.jobs?.title || "Skills Assessment"}
                </h2>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setDialogOpen(false);
                    setSelectedQuiz(null);
                    fetchQuizzes();
                  }}
                >
                  Close
                </Button>
              </div>
              
              <QuizTaker 
                quizId={selectedQuiz.id}
                applicationId={selectedQuiz.application_id}
                onComplete={() => {
                  setDialogOpen(false);
                  setSelectedQuiz(null);
                  fetchQuizzes();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
