
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { X } from "lucide-react";
import SkillsSelector from "./SkillsSelector";

const SkillsManager = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userSkills, setUserSkills] = useState<any[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);
  const [isAddingSkills, setIsAddingSkills] = useState(false);
  const [proficiencyMap, setProficiencyMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (userProfile) {
      fetchUserSkills();
    }
  }, [userProfile]);

  const fetchUserSkills = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("employee_skills")
        .select("*, skills(*)")
        .eq("employee_id", userProfile.id);

      if (error) {
        throw error;
      }

      const processedSkills = (data || []).map((item) => ({
        id: item.id,
        skill_id: item.skill_id,
        name: item.skills.name,
        description: item.skills.description,
        proficiency: item.proficiency
      }));

      setUserSkills(processedSkills);
    } catch (error: any) {
      toast({
        title: "Error fetching skills",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from("employee_skills")
        .delete()
        .eq("id", skillId);

      if (error) {
        throw error;
      }

      setUserSkills(userSkills.filter((skill) => skill.id !== skillId));
      
      toast({
        title: "Skill Removed",
        description: "Your skill has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error removing skill",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

  const handleSaveSkills = async () => {
    if (selectedSkills.length === 0) return;
    
    try {
      const newSkills = selectedSkills.map((skill) => ({
        employee_id: userProfile.id,
        skill_id: skill.id,
        proficiency: proficiencyMap[skill.id] || 3
      }));
      
      const { error } = await supabase
        .from("employee_skills")
        .insert(newSkills);
      
      if (error) throw error;
      
      fetchUserSkills();
      setSelectedSkills([]);
      setProficiencyMap({});
      setIsAddingSkills(false);
      
      toast({
        title: "Skills Added",
        description: "Your skills have been added successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error adding skills",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Skills</h2>
        {!isAddingSkills && (
          <Button onClick={() => setIsAddingSkills(true)}>Add Skills</Button>
        )}
      </div>
      
      {isAddingSkills ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <SkillsSelector
                selectedSkills={selectedSkills}
                onSkillsChange={handleSkillsChange}
              />
              
              {selectedSkills.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Set Your Proficiency Level</h3>
                  <div className="space-y-3">
                    {selectedSkills.map((skill) => (
                      <div key={skill.id} className="flex items-center justify-between">
                        <span>{skill.name}</span>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <button
                              key={level}
                              type="button"
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
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
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingSkills(false);
                    setSelectedSkills([]);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveSkills} disabled={selectedSkills.length === 0}>
                  Save Skills
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : userSkills.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-lg text-gray-500">You haven't added any skills yet.</p>
                <Button onClick={() => setIsAddingSkills(true)} className="mt-4">
                  Add Your First Skill
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {userSkills.map((skill) => (
                <Card key={skill.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{skill.name}</h3>
                      <button
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Proficiency:</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <span
                            key={level}
                            className={`w-4 h-4 rounded-full mx-0.5 ${
                              skill.proficiency >= level
                                ? "bg-primary"
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillsManager;
