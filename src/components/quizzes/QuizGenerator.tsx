
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import SkillsSelector from "@/components/skills/SkillsSelector";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

interface QuizGeneratorProps {
  onQuizGenerated?: (quizId: string) => void;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({ onQuizGenerated }) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);
  const [proficiencyMap, setProficiencyMap] = useState<Record<string, number>>({});
  const [saveToDatabase, setSaveToDatabase] = useState(true);
  const [questionsPerSkill, setQuestionsPerSkill] = useState(5);

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
        body: { 
          skills: skillsData,
          questionsPerSkill
        }
      });

      if (error) throw error;

      if (!data) {
        throw new Error("No data returned from quiz generation");
      }

      let quizId = "";

      // Save to database if requested
      if (saveToDatabase && userProfile) {
        const quiz = await saveQuizToDatabase(data.data);
        quizId = quiz.id;
        if (onQuizGenerated) onQuizGenerated(quiz.id);
        
        toast({
          title: "Quiz Generated and Saved",
          description: `Successfully generated a quiz with ${data.data.length} skills. You can find it in your assessments.`,
        });
        
        // Navigate to dashboard to view the saved quiz
        navigate("/dashboard");
      } else {
        toast({
          title: "Quiz Generated",
          description: `Successfully generated ${data.data.length} skills with customized questions.`,
        });
      }

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

  const saveQuizToDatabase = async (quizData: any[]) => {
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

    const quizId = quizData.id;

    // Add questions to the quiz
    const questionsToInsert = [];

    // Process each skill's questions
    for (const skillData of quizData) {
      if (skillData.questions && Array.isArray(skillData.questions)) {
        for (const question of skillData.questions) {
          questionsToInsert.push({
            quiz_id: quizId,
            skill_id: skillData.skill_id,
            question: question.question,
            options: JSON.stringify(question.options),
            correct_answer: question.correct_answer
          });
        }
      }
    }

    if (questionsToInsert.length > 0) {
      const { error: questionsError } = await supabase
        .from("quiz_questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;
    }

    return { id: quizId, questions: questionsToInsert.length };
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

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Questions per skill</h3>
              <select 
                className="border border-gray-300 rounded px-3 py-2 w-full"
                value={questionsPerSkill}
                onChange={(e) => setQuestionsPerSkill(Number(e.target.value))}
              >
                <option value="3">3 questions</option>
                <option value="5">5 questions</option>
                <option value="10">10 questions</option>
              </select>
            </div>

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
