
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuizQuestions } from "@/hooks/useQuizQuestions";
import { useQuizSubmission } from "@/hooks/useQuizSubmission";
import QuizQuestion from "./QuizQuestion";
import QuizLoading from "./QuizLoading";
import QuizEmpty from "./QuizEmpty";

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
  const { 
    questions, 
    loading, 
    retryCount, 
    retryInProgress, 
    maxRetries, 
    fetchQuizQuestions 
  } = useQuizQuestions(quizId);
  
  const { 
    submitting, 
    answers, 
    handleAnswerChange, 
    handleSubmitQuiz, 
    updateQuizStatus 
  } = useQuizSubmission(quizId, applicationId, onComplete);

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
      />
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Please answer all questions to complete your skills assessment.
      </p>

      {questions.map((question, index) => (
        <QuizQuestion
          key={question.id}
          question={question}
          index={index}
          answer={answers[question.id] || ""}
          onAnswerChange={handleAnswerChange}
        />
      ))}

      <div className="flex justify-end">
        <Button 
          onClick={() => handleSubmitQuiz(questions)} 
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
