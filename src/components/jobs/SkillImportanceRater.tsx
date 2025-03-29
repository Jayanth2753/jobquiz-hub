
import React from "react";

interface SkillImportanceRaterProps {
  skillId: string;
  skillName: string;
  importance: number;
  onImportanceChange: (skillId: string, importance: number) => void;
}

const SkillImportanceRater: React.FC<SkillImportanceRaterProps> = ({
  skillId,
  skillName,
  importance,
  onImportanceChange,
}) => {
  return (
    <div className="flex items-center justify-between">
      <span>{skillName}</span>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              importance >= level
                ? "bg-primary text-primary-foreground"
                : "bg-gray-200 text-gray-500"
            }`}
            onClick={() => onImportanceChange(skillId, level)}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SkillImportanceRater;
