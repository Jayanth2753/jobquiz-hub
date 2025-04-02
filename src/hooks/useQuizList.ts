
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface Quiz {
  id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  score: number | null;
  application_id: string | null;
  quiz_questions_count?: number;
  applications?: {
    jobs?: {
      title?: string;
    } | null;
  } | null;
}

export const useQuizList = (userProfileId: string, showPracticeQuizzes: boolean = false) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      
      if (showPracticeQuizzes) {
        // Fetch practice quizzes (those created without an application_id)
        const { data, error } = await supabase
          .from("quizzes")
          .select(`
            *,
            quiz_questions:quiz_questions(count)
          `)
          .is("application_id", null)
          .eq("employee_id", userProfileId)
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        console.log("Practice quizzes fetched:", data);
        
        // Transform the data to match our Quiz interface
        const transformedData = data?.map(quiz => ({
          ...quiz,
          // Fix: Access the first item of the array if it exists, then get the count
          quiz_questions_count: quiz.quiz_questions && quiz.quiz_questions[0] ? quiz.quiz_questions[0].count : 0
        })) || [];
        
        setQuizzes(transformedData);
      } else {
        // Fetch job-related quizzes
        const { data: applications, error: appError } = await supabase
          .from("applications")
          .select("id")
          .eq("employee_id", userProfileId);
        
        if (appError) throw appError;
        
        if (!applications || applications.length === 0) {
          setQuizzes([]);
          setLoading(false);
          return;
        }
        
        // Get application IDs
        const applicationIds = applications.map(app => app.id);
        
        // Then get quizzes linked to those applications
        const { data, error } = await supabase
          .from("quizzes")
          .select(`
            *,
            applications(
              jobs(
                id, title
              )
            ),
            quiz_questions:quiz_questions(count)
          `)
          .in("application_id", applicationIds)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        // Transform the data to match our Quiz interface
        const transformedData = data?.map(quiz => ({
          ...quiz,
          // Fix: Access the first item of the array if it exists, then get the count
          quiz_questions_count: quiz.quiz_questions && quiz.quiz_questions[0] ? quiz.quiz_questions[0].count : 0
        })) || [];
        
        setQuizzes(transformedData);
      }
    } catch (error: any) {
      console.error("Error fetching quizzes:", error);
      toast({
        title: "Error fetching quizzes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfileId) {
      fetchQuizzes();
    }
  }, [userProfileId, showPracticeQuizzes]);

  return { quizzes, loading, fetchQuizzes };
};
