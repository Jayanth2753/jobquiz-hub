
import React from "react";
import { Label } from "@/components/ui/label";
import SkillsSelector from "@/components/skills/SkillsSelector";
import SkillImportanceRater from "./SkillImportanceRater";

interface JobSkillsSectionProps {
  selectedSkills: any[];
  skillImportance: Record<string, number>;
  onSkillsChange: (skills: any[]) => void;
  onImportanceChange: (skillId: string, importance: number) => void;
}

const JobSkillsSection: React.FC<JobSkillsSectionProps> = ({
  selectedSkills,
  skillImportance,
  onSkillsChange,
  onImportanceChange,
}) => {
  return (
    <div className="space-y-3">
      <Label>Required Skills *</Label>
      <SkillsSelector
        selectedSkills={selectedSkills}
        onSkillsChange={onSkillsChange}
      />
      
      {selectedSkills.length > 0 && (
        <div className="mt-4">
          <Label>Skill Importance</Label>
          <div className="space-y-3 mt-2">
            {selectedSkills.map((skill) => (
              <SkillImportanceRater
                key={skill.id}
                skillId={skill.id}
                skillName={skill.name}
                importance={skillImportance[skill.id] || 3}
                onImportanceChange={onImportanceChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSkillsSection;
