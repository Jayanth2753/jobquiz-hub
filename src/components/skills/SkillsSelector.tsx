
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface SkillsSelectorProps {
  selectedSkills: any[];
  onSkillsChange: (skills: any[]) => void;
}

const SkillsSelector: React.FC<SkillsSelectorProps> = ({
  selectedSkills,
  onSkillsChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [allSkills, setAllSkills] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("name");

      if (error) {
        throw error;
      }

      setAllSkills(data || []);
    } catch (error) {
      console.error("Error fetching skills:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSkill = (skill: any) => {
    if (!selectedSkills.some((s) => s.id === skill.id)) {
      onSkillsChange([...selectedSkills, skill]);
    }
    setSearchValue("");
  };

  const handleRemoveSkill = (skillId: string) => {
    onSkillsChange(selectedSkills.filter((s) => s.id !== skillId));
  };

  const filteredSkills = allSkills.filter(
    (skill) =>
      !selectedSkills.some((s) => s.id === skill.id) &&
      skill.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedSkills.map((skill) => (
          <Badge key={skill.id} variant="secondary" className="flex items-center gap-1">
            {skill.name}
            <button
              type="button"
              onClick={() => handleRemoveSkill(skill.id)}
              className="text-muted-foreground rounded-full hover:bg-gray-200 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      <div className="relative">
        <Command className="border rounded-md bg-white">
          <CommandInput
            placeholder="Search skills..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-9"
          />
          <CommandEmpty className="py-6 text-center text-sm">
            {isLoading ? "Loading skills..." : "No skills found."}
          </CommandEmpty>
          <CommandGroup className="max-h-52 overflow-y-auto">
            {filteredSkills.map((skill) => (
              <CommandItem
                key={skill.id}
                value={skill.name}
                onSelect={() => handleSelectSkill(skill)}
                className="cursor-pointer"
              >
                {skill.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </div>
    </div>
  );
};

export default SkillsSelector;
