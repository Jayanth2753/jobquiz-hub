import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw, Eye } from "lucide-react";
import ProficiencySelector from "./ProficiencySelector";
import QuizQuestionComponent from "./QuizQuestion";
import QuizDetails from "./QuizDetails";

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
  const [commonSkills, setCommonSkills] = useState<any[]>([]);
  const [showProficiencySelector, setShowProficiencySelector] = useState(false);
  const [quizGenerationInProgress, setQuizGenerationInProgress] = useState(false);
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

  const getCommonSkills = async () => {
    if (!applicationId) return [];
    
    try {
      setLoading(true);
      console.log("Fetching common skills for application ID:", applicationId);
      
      // Get the job ID from the application
      const { data: application, error: appError } = await supabase
        .from("applications")
        .select("job_id")
        .eq("id", applicationId)
        .single();
        
      if (appError || !application) {
        console.error("Error fetching application:", appError);
        return [];
      }
      
      const jobId = application.job_id;
      console.log("Found job ID:", jobId);
      
      // Get the user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found");
        return [];
      }
      
      // Get skills required for the job
      const { data: jobSkills, error: jobSkillsError } = await supabase
        .from("job_skills")
        .select(`
          skill_id,
          importance,
          skills (
            id,
            name
          )
        `)
        .eq("job_id", jobId);
        
      if (jobSkillsError) {
        console.error("Error fetching job skills:", jobSkillsError);
        return [];
      }
      console.log("Job skills:", jobSkills);
      
      // Get user's skills
      const { data: userSkills, error: userSkillsError } = await supabase
        .from("employee_skills")
        .select(`
          skill_id,
          proficiency,
          skills (
            id,
            name
          )
        `)
        .eq("employee_id", user.id);
        
      if (userSkillsError) {
        console.error("Error fetching user skills:", userSkillsError);
        return [];
      }
      console.log("User skills:", userSkills);
      
      // Find common skills
      const common = jobSkills.filter(jobSkill => 
        userSkills.some(userSkill => userSkill.skill_id === jobSkill.skill_id)
      );
      
      // Map to the format we need
      const commonSkillsData = common.map(skill => ({
        id: skill.skill_id,
        name: skill.skills.name,
        proficiency: userSkills.find(us => us.skill_id === skill.skill_id)?.proficiency || 3,
        importance: skill.importance
      }));
      
      console.log("Common skills:", commonSkillsData);
      setCommonSkills(commonSkillsData);
      
      // Always show proficiency selector if there are common skills
      if (commonSkillsData.length > 0) {
        console.log("Showing proficiency selector");
        setShowProficiencySelector(true);
      } else {
        console.log("No common skills found, using job skills instead");
        // If no common skills, use all job skills with default proficiency
        const jobSkillsData = jobSkills.map(skill => ({
          id: skill.skill_id,
          name: skill.skills.name,
          proficiency: 3, // Default proficiency
          importance: skill.importance
        }));
        
        if (jobSkillsData.length > 0) {
          setCommonSkills(jobSkillsData);
          setShowProficiencySelector(true);
        } else {
          console.log("No job skills found either, fetching existing questions");
          await fetchQuizQuestions();
        }
      }
      
      return commonSkillsData;
    } catch (error) {
      console.error("Error getting common skills:", error);
      await fetchQuizQuestions(); // Fallback to fetching existing questions
      return [];
    } finally {
      setLoading(false);
    }
  };

  const generateQuizWithOpenAI = async (skillsWithProficiency: any[]) => {
    try {
      setQuizGenerationInProgress(true);
      console.log("Generating quiz with skills:", skillsWithProficiency);
      
      // First, delete any existing questions for this quiz
      try {
        const { error: deleteError } = await supabase
          .from("quiz_questions")
          .delete()
          .eq("quiz_id", quizId);
          
        if (deleteError) {
          console.error("Error deleting existing questions:", deleteError);
        }
      } catch (deleteError) {
        console.error("Exception deleting questions:", deleteError);
      }
      
      // Then generate new questions
      try {
        const { data, error } = await supabase.functions.invoke("generate-quiz-questions", {
          body: { 
            skills: skillsWithProficiency,
            questionsPerSkill: 10,
            quizId: quizId,
            applicationId: applicationId
          }
        });

        if (error) {
          console.error("Error invoking generate-quiz-questions function:", error);
          throw error;
        }

        console.log("Quiz generation response:", data);
        
        if (data && data.quizId) {
          // Wait a moment for the database to update
          setTimeout(async () => {
            await fetchQuizQuestions();
          }, 3000);
        }
      } catch (invokeError) {
        console.error("Exception invoking function:", invokeError);
        toast({
          title: "Error generating quiz",
          description: "Failed to generate quiz questions. Using default questions instead.",
        });
        
        // We'll fetch questions anyway after a delay, in case some were created
        setTimeout(async () => {
          await fetchQuizQuestions();
        }, 3000);
      }
    } catch (error) {
      console.error("Error generating quiz with OpenAI:", error);
      toast({
        title: "Error generating quiz",
        description: "Failed to generate quiz questions. Please try again.",
        variant: "destructive",
      });
      // Fallback to fetching any questions that might have been created
      await fetchQuizQuestions();
    } finally {
      setQuizGenerationInProgress(false);
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
      
      // If no questions found and we haven't shown the proficiency selector yet
      if (parsedQuestions.length === 0 && !showProficiencySelector && commonSkills.length > 0) {
        setShowProficiencySelector(true);
      }
      
      // If questions were found, don't show the proficiency selector anymore
      if (parsedQuestions.length > 0) {
        setShowProficiencySelector(false);
      }
      
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

  const handleProficiencyComplete = (skillsWithProficiency: any[]) => {
    console.log("Proficiency selection complete. Selected proficiencies:", skillsWithProficiency);
    setShowProficiencySelector(false);
    generateQuizWithOpenAI(skillsWithProficiency);
  };

  useEffect(() => {
    if (questions.length === 0 && retryCount < maxRetries && !loading && !retryInProgress && !quizGenerationInProgress && !showProficiencySelector) {
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
  }, [questions, loading, retryCount, retryInProgress, quizGenerationInProgress, showProficiencySelector]);

  useEffect(() => {
    updateQuizStatus();
    getCommonSkills();
  }, [quizId, applicationId]);

  if (showProficiencySelector) {
    return <ProficiencySelector skills={commonSkills} onComplete={handleProficiencyComplete} />;
  }

  if (loading || retryInProgress || quizGenerationInProgress) {
    return (
      <QuizLoading 
        isRefreshing={retryInProgress || quizGenerationInProgress} 
      />
    );
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
        <QuizQuestionComponent
          key={question.id}
          question={question}
          index={index}
          answer={answers[question.id] || ""}
          onAnswerChange={handleAnswerChange}
        />
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
  const [viewingCompleted, setViewingCompleted] = useState(false);

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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-lg text-gray-500">
          You don't have any job assessments yet. Apply for a job to get a skills assessment.
        </p>
      </div>
    );
  }

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
                  <div className="space-y-2">
                    <div className="text-lg font-semibold">
                      Score: {quiz.score}%
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedQuiz(quiz);
                        setViewingCompleted(true);
                        setDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Answers
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => {
                      setSelectedQuiz(quiz);
                      setViewingCompleted(false);
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
                    setViewingCompleted(false);
                    fetchQuizzes();
                  }}
                >
                  Close
                </Button>
              </div>
              
              {viewingCompleted ? (
                <QuizTaker
                  quizId={selectedQuiz.id}
                  applicationId={selectedQuiz.application_id}
                  onComplete={() => {}}
                  viewMode={true}
                  isEmployer={false}
                />
              ) : (
                <QuizTaker 
                  quizId={selectedQuiz.id}
                  applicationId={selectedQuiz.application_id}
                  onComplete={() => {
                    setDialogOpen(false);
                    setSelectedQuiz(null);
                    fetchQuizzes();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
