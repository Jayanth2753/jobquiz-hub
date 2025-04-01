
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

interface Skill {
  id: string;
  name: string;
  proficiency?: number;
}

interface SkillBasedQuizCreatorProps {
  onComplete?: () => void;
}

const SkillBasedQuizCreator: React.FC<SkillBasedQuizCreatorProps> = ({ onComplete }) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [proficiencyLevel, setProficiencyLevel] = useState<number>(3);
  const [questionsPerSkill, setQuestionsPerSkill] = useState(10);

  useEffect(() => {
    if (userProfile?.id) {
      fetchUserSkills();
    }
  }, [userProfile]);

  const fetchUserSkills = async () => {
    try {
      setLoadingSkills(true);
      const { data, error } = await supabase
        .from("employee_skills")
        .select(`
          skill_id,
          proficiency,
          skills (
            id, 
            name
          )
        `)
        .eq("employee_id", userProfile?.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedSkills = data.map((item) => ({
          id: item.skills.id,
          name: item.skills.name,
          proficiency: item.proficiency
        }));
        setUserSkills(mappedSkills);
        if (mappedSkills.length > 0) {
          setSelectedSkill(mappedSkills[0]);
          setProficiencyLevel(mappedSkills[0].proficiency || 3);
        }
      }
    } catch (error) {
      console.error("Error fetching user skills:", error);
      toast({
        title: "Error",
        description: "Failed to load your skills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingSkills(false);
    }
  };

  const handleSkillChange = (skillId: string) => {
    const skill = userSkills.find(s => s.id === skillId);
    if (skill) {
      setSelectedSkill(skill);
      setProficiencyLevel(skill.proficiency || 3);
    }
  };

  const handleCreateQuiz = async () => {
    if (!selectedSkill) {
      toast({
        title: "No skill selected",
        description: "Please select a skill to create a quiz.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const skillData = {
        id: selectedSkill.id,
        name: selectedSkill.name,
        proficiency: proficiencyLevel
      };

      // First, create the quiz record with the employee_id
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          status: "pending",
          employee_id: userProfile.id // Use employee_id for practice quizzes
        })
        .select()
        .single();

      if (quizError) throw quizError;

      console.log("Created quiz record:", quizData);
      const quizId = quizData.id;

      console.log("Creating quiz for skill:", skillData);

      // Then generate questions
      const { data, error } = await supabase.functions.invoke("generate-quiz-questions", {
        body: { 
          skills: [skillData],
          questionsPerSkill,
          quizId
        }
      });

      if (error) {
        console.error("Error from edge function:", error);
        throw error;
      }

      console.log("Quiz generation response:", data);
      
      if (quizId) {
        toast({
          title: "Quiz Created",
          description: `Successfully created a quiz for ${selectedSkill.name}.`,
        });
        
        if (onComplete) {
          onComplete();
        } else {
          navigate("/dashboard?tab=practice-quizzes");
        }
      }

    } catch (error: any) {
      console.error("Error creating quiz:", error);
      toast({
        title: "Error creating quiz",
        description: error.message || "Failed to create quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingSkills) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userSkills.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Skills Added</h3>
            <p className="text-muted-foreground mb-4">
              You need to add skills to your profile before you can take a quiz.
            </p>
            <Button asChild>
              <Link to="/manage-skills">Add Skills</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Practice Quiz</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Select a Skill</h3>
            <p className="text-sm text-gray-500 mb-4">
              Choose a skill from your profile that you'd like to practice.
            </p>
            
            <RadioGroup
              value={selectedSkill?.id || ""}
              onValueChange={handleSkillChange}
              className="space-y-2"
            >
              {userSkills.map((skill) => (
                <div key={skill.id} className="flex items-center space-x-2 border p-3 rounded-md">
                  <RadioGroupItem value={skill.id} id={`skill-${skill.id}`} />
                  <Label htmlFor={`skill-${skill.id}`} className="flex-1 cursor-pointer">
                    <span className="font-medium">{skill.name}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      (Proficiency: {skill.proficiency || 3}/5)
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Adjust Difficulty</h3>
            <p className="text-sm text-gray-500 mb-4">
              Set the difficulty level for your quiz questions. This may differ from your current proficiency.
            </p>
            
            <div className="flex items-center space-x-1 mb-4">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    proficiencyLevel >= level
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-200 text-gray-500"
                  }`}
                  onClick={() => setProficiencyLevel(level)}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              1: Beginner, 3: Intermediate, 5: Expert
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Number of Questions</h3>
            <select 
              className="border border-gray-300 rounded px-3 py-2 w-full"
              value={questionsPerSkill}
              onChange={(e) => setQuestionsPerSkill(Number(e.target.value))}
            >
              <option value="5">5 questions</option>
              <option value="10">10 questions</option>
              <option value="15">15 questions</option>
            </select>
          </div>

          <Button 
            onClick={handleCreateQuiz} 
            disabled={isLoading || !selectedSkill}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Quiz...
              </>
            ) : (
              "Create Quiz"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillBasedQuizCreator;
