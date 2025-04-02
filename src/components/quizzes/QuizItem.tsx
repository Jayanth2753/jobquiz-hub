
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Quiz } from "@/hooks/useQuizList";

interface QuizItemProps {
  quiz: Quiz;
  onStartQuiz: (quiz: Quiz) => void;
}

const QuizItem: React.FC<QuizItemProps> = ({ quiz, onStartQuiz }) => {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Add a null check for nested objects
  const jobTitle = quiz.applications?.jobs?.title || 'Practice Quiz';
  const questionCount = quiz.quiz_questions_count || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle>
            {jobTitle} - Skills Assessment
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Created: {new Date(quiz.created_at).toLocaleDateString()}
            {questionCount > 0 && ` • ${questionCount} questions`}
          </p>
        </div>
        <Badge className={getStatusBadgeColor(quiz.status)}>
          {quiz.status.replace("_", " ").charAt(0).toUpperCase() + quiz.status.replace("_", " ").slice(1)}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quiz.status === "completed" && (
            <div>
              <p className="text-sm font-medium">Your Score</p>
              <div className="flex items-center mt-1">
                <p className="text-xl font-bold">{quiz.score}%</p>
                <div className="ml-4 flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${quiz.score}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Completed on: {quiz.completed_at ? new Date(quiz.completed_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          )}

          {quiz.status !== "completed" && (
            <Button onClick={() => onStartQuiz(quiz)}>
              {quiz.status === "in_progress" ? "Continue Quiz" : "Start Quiz"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizItem;
