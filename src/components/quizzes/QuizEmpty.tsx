
import React from "react";
import { Button } from "@/components/ui/button";

interface QuizEmptyProps {
  retryCount: number;
  maxRetries: number;
  onRefresh: () => void;
}

const QuizEmpty: React.FC<QuizEmptyProps> = ({ retryCount, maxRetries, onRefresh }) => {
  return (
    <div className="text-center py-8 space-y-4">
      <p className="text-lg text-gray-500">
        No questions found for this quiz. The system is still generating your quiz questions.
      </p>
      <p className="text-sm text-gray-400">
        {retryCount < maxRetries 
          ? `We've tried ${retryCount} times. Auto-retrying in 5 seconds...` 
          : "We've tried several times but couldn't find your questions."}
      </p>
      <Button 
        onClick={onRefresh} 
        className="mt-4"
      >
        Refresh Manually
      </Button>
    </div>
  );
};

export default QuizEmpty;
