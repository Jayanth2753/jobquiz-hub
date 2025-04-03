
import React from "react";
import { QuizManager } from "./Quiz";

interface QuizListProps {
  showPracticeQuizzes?: boolean;
}

const QuizList: React.FC<QuizListProps> = ({ showPracticeQuizzes = false }) => {
  return <QuizManager showPracticeQuizzes={showPracticeQuizzes} />;
};

export default QuizList;
