
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface Skill {
  id: string;
  name: string;
  proficiency?: number;
}

interface ProficiencySelectorProps {
  skills: Skill[];
  onComplete: (skillsWithProficiency: Skill[]) => void;
}

const ProficiencySelector: React.FC<ProficiencySelectorProps> = ({
  skills,
  onComplete,
}) => {
  const [proficiencyMap, setProficiencyMap] = useState<Record<string, number>>(
    skills.reduce((acc, skill) => {
      acc[skill.id] = skill.proficiency || 3;
      return acc;
    }, {} as Record<string, number>)
  );

  const handleProficiencyChange = (skillId: string, proficiency: number) => {
    setProficiencyMap({
      ...proficiencyMap,
      [skillId]: proficiency,
    });
  };

  const handleComplete = () => {
    const updatedSkills = skills.map(skill => ({
      ...skill,
      proficiency: proficiencyMap[skill.id] || 3
    }));
    
    toast({
      title: "Proficiency levels set",
      description: "Generating your personalized quiz questions..."
    });
    
    onComplete(updatedSkills);
  };

  return (
    <Card className="shadow-lg border-2 border-primary/20">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-center text-xl">Set Your Proficiency Level</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-sm text-gray-500 mb-6">
          For each skill, set your proficiency level to get appropriate questions.
          Level 1 is basic knowledge, and level 5 is expert knowledge.
        </p>

        <div className="space-y-6">
          {skills.map((skill) => (
            <div key={skill.id} className="space-y-2 border p-4 rounded-md shadow-sm">
              <h3 className="font-medium text-lg">{skill.name}</h3>
              <p className="text-sm text-gray-500 mb-2">Select your proficiency level:</p>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      proficiencyMap[skill.id] >= level
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                    }`}
                    onClick={() => handleProficiencyChange(skill.id, level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {proficiencyMap[skill.id] === 1 && "Beginner: Basic knowledge only"}
                {proficiencyMap[skill.id] === 2 && "Elementary: Limited practical experience"}
                {proficiencyMap[skill.id] === 3 && "Intermediate: Practical working knowledge"}
                {proficiencyMap[skill.id] === 4 && "Advanced: Deep practical knowledge"}
                {proficiencyMap[skill.id] === 5 && "Expert: Comprehensive authoritative knowledge"}
              </div>
            </div>
          ))}
        </div>

        <Button onClick={handleComplete} className="w-full mt-8">
          Generate My Quiz Questions
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProficiencySelector;
