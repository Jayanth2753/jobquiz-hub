
import React from "react";
import { QuizManager } from "./Quiz";

interface QuizListProps {
  showPracticeQuizzes?: boolean;
}

const QuizList: React.FC<QuizListProps> = ({ showPracticeQuizzes = false }) => {
  // We're removing practice quizzes functionality, so we'll always pass false
  return <QuizManager showPracticeQuizzes={false} />;
};

export default QuizList;
