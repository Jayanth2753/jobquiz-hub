
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { QuizQuestion } from "./useQuizQuestions";

export const useQuizSubmission = (quizId: string, applicationId: string | null | undefined, onComplete: () => void) => {
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

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

  const handleSubmitQuiz = async (questions: QuizQuestion[]) => {
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

  return {
    submitting,
    answers,
    handleAnswerChange,
    handleSubmitQuiz,
    updateQuizStatus
  };
};
