
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface QuizEmptyProps {
  retryCount: number;
  maxRetries: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const QuizEmpty: React.FC<QuizEmptyProps> = ({ 
  retryCount, 
  maxRetries, 
  onRefresh,
  isRefreshing = false
}) => {
  return (
    <div className="text-center py-8 space-y-4">
      <p className="text-lg text-gray-500">
        No questions found for this quiz. The system is still generating your quiz questions.
      </p>
      <div className="flex flex-col items-center justify-center space-y-2">
        <p className="text-sm text-gray-400">
          {retryCount < maxRetries 
            ? `We've tried ${retryCount} times. Auto-retrying in 5 seconds...` 
            : "We've tried several times but couldn't find your questions."}
        </p>
        <p className="text-sm text-gray-400">
          Quiz generation can take up to 1-2 minutes to complete.
        </p>
      </div>
      <Button 
        onClick={onRefresh} 
        className="mt-4"
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Refreshing...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Manually
          </>
        )}
      </Button>
    </div>
  );
};

export default QuizEmpty;
