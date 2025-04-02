
import React from "react";

interface QuizLoadingProps {
  isRefreshing?: boolean;
}

const QuizLoading: React.FC<QuizLoadingProps> = ({ isRefreshing = false }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-3"></div>
      <p className="text-gray-500">
        {isRefreshing ? "Refreshing questions..." : "Loading quiz questions..."}
      </p>
      <p className="text-sm text-gray-400 mt-2">
        This may take a moment. The system is checking for your questions.
      </p>
    </div>
  );
};

export default QuizLoading;
