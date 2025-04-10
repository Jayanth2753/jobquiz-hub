
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface QuizDetailsProps {
  quizId: string;
  isEmployer: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  skill?: {
    name: string;
  } | null;
}

interface QuizAnswer {
  id: string;
  question_id: string;
  answer: string;
  is_correct: boolean;
}

const QuizDetails: React.FC<QuizDetailsProps> = ({ quizId, isEmployer }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  useEffect(() => {
    fetchQuizDetails();
  }, [quizId]);

  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      
      // Get the quiz score
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("score")
        .eq("id", quizId)
        .single();
        
      if (quizError) throw quizError;
      setQuizScore(quizData.score);
      
      // Get the questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*, skills(name)")
        .eq("quiz_id", quizId);
        
      if (questionsError) throw questionsError;
      
      // Parse the options if needed
      const parsedQuestions = (questionsData || []).map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }));
      
      setQuestions(parsedQuestions);
      
      // Get the answers
      const { data: answersData, error: answersError } = await supabase
        .from("quiz_answers")
        .select("*")
        .in(
          "question_id", 
          parsedQuestions.map(q => q.id)
        );
        
      if (answersError) throw answersError;
      
      // Convert answers to record for easy lookup
      const answersRecord: Record<string, QuizAnswer> = {};
      answersData.forEach((answer: QuizAnswer) => {
        answersRecord[answer.question_id] = answer;
      });
      
      setAnswers(answersRecord);
    } catch (error: any) {
      console.error("Error fetching quiz details:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-medium">Quiz Results</h3>
        {quizScore !== null && (
          <Badge 
            className={
              quizScore >= 80 ? "bg-green-100 text-green-800" :
              quizScore >= 60 ? "bg-blue-100 text-blue-800" :
              quizScore >= 40 ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            }
          >
            Score: {quizScore}%
          </Badge>
        )}
      </div>
      
      {questions.map((question, index) => {
        const userAnswer = answers[question.id]?.answer || "";
        const isCorrect = answers[question.id]?.is_correct || false;
        
        return (
          <Card key={question.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between">
                <CardTitle className="text-base font-medium">
                  {index + 1}. {question.question}
                </CardTitle>
                {question.skill?.name && (
                  <Badge variant="outline" className="ml-2">
                    {question.skill.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {question.options.map((option, optIndex) => (
                  <div 
                    key={optIndex}
                    className={`p-3 rounded-md ${
                      option === userAnswer && option === question.correct_answer
                        ? "bg-green-50 border border-green-200"
                        : option === userAnswer && option !== question.correct_answer
                        ? "bg-red-50 border border-red-200"
                        : option === question.correct_answer && isEmployer
                        ? "bg-green-50 border border-green-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        {option}
                      </div>
                      <div className="ml-2 flex">
                        {option === userAnswer && (
                          <Badge variant="outline" className="ml-2">
                            Selected
                          </Badge>
                        )}
                        {option === question.correct_answer && isEmployer && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-2">
                            Correct
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default QuizDetails;
