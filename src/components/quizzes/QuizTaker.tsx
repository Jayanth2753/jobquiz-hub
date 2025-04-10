
import React from "react";
import { QuizTaker as ConsolidatedQuizTaker } from "./Quiz";
import QuizDetails from "./QuizDetails";
import { useAuth } from "@/contexts/AuthContext";

interface QuizTakerProps {
  quizId: string;
  applicationId?: string | null;
  onComplete?: () => void;
  viewMode?: boolean;
  isEmployer?: boolean;
}

const QuizTaker: React.FC<QuizTakerProps> = ({
  quizId,
  applicationId,
  onComplete = () => {},
  viewMode = false,
  isEmployer = false,
}) => {
  if (viewMode) {
    return <QuizDetails quizId={quizId} isEmployer={isEmployer} />;
  }

  return (
    <ConsolidatedQuizTaker
      quizId={quizId}
      applicationId={applicationId}
      onComplete={onComplete}
    />
  );
};

export default QuizTaker;
