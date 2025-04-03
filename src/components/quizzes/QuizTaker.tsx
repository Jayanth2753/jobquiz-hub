
import React from "react";
import { QuizTaker as ConsolidatedQuizTaker } from "./Quiz";

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
  return (
    <ConsolidatedQuizTaker
      quizId={quizId}
      applicationId={applicationId}
      onComplete={onComplete}
    />
  );
};

export default QuizTaker;
