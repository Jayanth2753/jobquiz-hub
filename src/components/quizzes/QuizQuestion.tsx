
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { QuizQuestion as QuestionType } from "./Quiz";

interface QuizQuestionProps {
  question: QuestionType;
  index: number;
  answer: string;
  onAnswerChange: (questionId: string, answer: string) => void;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  index,
  answer,
  onAnswerChange,
}) => {
  return (
    <Card key={question.id}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">
              {index + 1}. {question.question}
            </h3>
            <p className="text-sm text-gray-500">
              Skill: {question.skills?.name || "Unknown"}
            </p>
          </div>

          <RadioGroup
            value={answer || ""}
            onValueChange={(value) => onAnswerChange(question.id, value)}
          >
            {question.options.map((option: string) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizQuestion;
