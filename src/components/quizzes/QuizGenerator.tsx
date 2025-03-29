
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import SkillsSelector from "@/components/skills/SkillsSelector";
import { Checkbox } from "@/components/ui/checkbox";

interface QuizGeneratorProps {
  onQuizGenerated?: (quizId: string) => void;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({ onQuizGenerated }) => {
  const { userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);
  const [proficiencyMap, setProficiencyMap] = useState<Record<string, number>>({});
  const [saveToDatabase, setSaveToDatabase] = useState(true);
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);

  const handleSkillsChange = (skills: any[]) => {
    setSelectedSkills(skills);
    
    // Initialize proficiency for new skills
    const newProficiency = { ...proficiencyMap };
    skills.forEach((skill) => {
      if (!newProficiency[skill.id]) {
        newProficiency[skill.id] = 3; // Default to medium proficiency
      }
    });
    
    setProficiencyMap(newProficiency);
  };

  const handleProficiencyChange = (skillId: string, proficiency: number) => {
    setProficiencyMap({
      ...proficiencyMap,
      [skillId]: proficiency
    });
  };

  const handleGenerateQuiz = async () => {
    if (selectedSkills.length === 0) {
      toast({
        title: "No skills selected",
        description: "Please select at least one skill to generate a quiz.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Prepare skills data with proficiency levels
      const skillsData = selectedSkills.map(skill => ({
        id: skill.id,
        name: skill.name,
        proficiency: proficiencyMap[skill.id] || 3
      }));

      // Call the edge function to generate questions
      const { data, error } = await supabase.functions.invoke("generate-quiz-questions", {
        body: { skills: skillsData }
      });

      if (error) throw error;

      // Save to database if requested
      if (saveToDatabase && userProfile) {
        const quiz = await saveQuizToDatabase(data.questions);
        setGeneratedQuiz(quiz);
        if (onQuizGenerated) onQuizGenerated(quiz.id);
      } else {
        setGeneratedQuiz({ questions: data.questions });
      }

      toast({
        title: "Quiz Generated",
        description: `Successfully generated ${data.questions.length} questions based on your skills.`,
      });
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Error generating quiz",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveQuizToDatabase = async (questions: any[]) => {
    // Create a new quiz
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        application_id: crypto.randomUUID(), // This would normally be linked to an application
        status: "pending",
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (quizError) throw quizError;

    // Add questions to the quiz
    const questionsToInsert = questions.map(q => ({
      quiz_id: quizData.id,
      skill_id: q.skill_id,
      question: q.question,
      options: JSON.stringify(q.options),
      correct_answer: q.correct_answer
    }));

    const { error: questionsError } = await supabase
      .from("quiz_questions")
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

    return { ...quizData, questions };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Skill Assessment Quiz</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Select Skills</h3>
            <p className="text-sm text-gray-500 mb-4">
              Choose the skills you want to be tested on and set your proficiency level for each skill.
            </p>
            
            <SkillsSelector 
              selectedSkills={selectedSkills} 
              onSkillsChange={handleSkillsChange} 
            />
          </div>

          {selectedSkills.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Set Proficiency Levels</h3>
              <p className="text-sm text-gray-500 mb-4">
                Adjust the proficiency level for each skill to get appropriate questions.
                Level 1 is basic knowledge, and level 5 is expert knowledge.
              </p>
              
              <div className="space-y-4">
                {selectedSkills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between">
                    <span className="font-medium">{skill.name}</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          type="button"
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            proficiencyMap[skill.id] >= level
                              ? "bg-primary text-primary-foreground"
                              : "bg-gray-200 text-gray-500"
                          }`}
                          onClick={() => handleProficiencyChange(skill.id, level)}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="saveToDatabase" 
              checked={saveToDatabase} 
              onCheckedChange={(checked) => setSaveToDatabase(checked as boolean)}
            />
            <label htmlFor="saveToDatabase" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Save quiz to database
            </label>
          </div>

          <Button 
            onClick={handleGenerateQuiz} 
            disabled={isLoading || selectedSkills.length === 0}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              "Generate Quiz"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizGenerator;
