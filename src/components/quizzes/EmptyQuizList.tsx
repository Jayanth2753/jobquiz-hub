
import React from "react";
import { Button } from "@/components/ui/button";

interface EmptyQuizListProps {
  showPracticeQuizzes: boolean;
  onCreateQuiz: () => void;
}

const EmptyQuizList: React.FC<EmptyQuizListProps> = ({ 
  showPracticeQuizzes, 
  onCreateQuiz 
}) => {
  return (
    <div className="text-center py-8 space-y-4">
      <p className="text-lg text-gray-500">
        {showPracticeQuizzes 
          ? "You don't have any practice quizzes yet." 
          : "You don't have any job quizzes assigned yet. Apply for a job to get a skills assessment."}
      </p>
      {showPracticeQuizzes && (
        <Button onClick={onCreateQuiz}>
          Create Practice Quiz
        </Button>
      )}
    </div>
  );
};

export default EmptyQuizList;
