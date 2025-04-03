
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    onComplete(updatedSkills);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Your Proficiency Level</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-6">
          For each skill, set your proficiency level to get appropriate questions.
          Level 1 is basic knowledge, and level 5 is expert knowledge.
        </p>

        <div className="space-y-6">
          {skills.map((skill) => (
            <div key={skill.id} className="space-y-2">
              <h3 className="font-medium">{skill.name}</h3>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
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

        <Button onClick={handleComplete} className="w-full mt-6">
          Continue to Quiz
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProficiencySelector;
