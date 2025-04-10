
import React from "react";
import { QuizManager } from "./Quiz";

interface QuizListProps {
  showPracticeQuizzes?: boolean;
}

const QuizList: React.FC<QuizListProps> = ({ showPracticeQuizzes = false }) => {
  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-6">Job Skills Assessments</h2>
      <QuizManager showPracticeQuizzes={showPracticeQuizzes} />
    </div>
  );
};

export default QuizList;
