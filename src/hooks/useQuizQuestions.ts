
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  skills?: {
    name: string;
  } | null;
}

export const useQuizQuestions = (quizId: string) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [retryInProgress, setRetryInProgress] = useState(false);
  const maxRetries = 5;

  const fetchQuizQuestions = async () => {
    try {
      setLoading(true);
      console.log(`Fetching questions for quiz ID: ${quizId}`);

      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*, skills(name)")
        .eq("quiz_id", quizId);

      if (error) {
        throw error;
      }

      console.log(`Found ${data?.length || 0} questions for quiz ID: ${quizId}`, data);

      // Parse options from JSON string if needed
      const parsedQuestions = (data || []).map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }));

      setQuestions(parsedQuestions);
    } catch (error: any) {
      console.error("Error fetching quiz questions:", error);
      toast({
        title: "Error fetching quiz questions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-retry if no questions are found
  useEffect(() => {
    if (questions.length === 0 && retryCount < maxRetries && !loading && !retryInProgress) {
      const timer = setTimeout(() => {
        console.log(`Auto-retrying to fetch questions (attempt ${retryCount + 1}/${maxRetries})...`);
        setRetryInProgress(true);
        fetchQuizQuestions().finally(() => {
          setRetryInProgress(false);
          setRetryCount(prev => prev + 1);
        });
      }, 5000); // 5 second delay between retries
      
      return () => clearTimeout(timer);
    }
  }, [questions, loading, retryCount, retryInProgress, quizId]);

  useEffect(() => {
    fetchQuizQuestions();
  }, [quizId]);

  return {
    questions,
    loading,
    retryCount,
    retryInProgress,
    maxRetries,
    fetchQuizQuestions
  };
};
