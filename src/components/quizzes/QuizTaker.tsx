
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";

interface QuizTakerProps {
  quizId: string;
  applicationId?: string | null;
  onComplete: () => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({
  quizId,
  applicationId,
  onComplete,
}) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchQuizQuestions();
    updateQuizStatus();
  }, [quizId]);

  const fetchQuizQuestions = async () => {
    try {
      setLoading(true);
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
    }
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

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
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
        description: applicationId
          ? `You scored ${score}%. Your application has been updated.`
          : `You scored ${score}% on your practice quiz.`,
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-500">
          No questions found for this quiz. This might be because the quiz questions are still being generated. Please wait a moment and try again.
        </p>
        <Button 
          onClick={fetchQuizQuestions} 
          className="mt-4"
        >
          Refresh Questions
        </Button>
      </div>
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

export default QuizTaker;
