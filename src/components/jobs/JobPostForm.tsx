
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import SkillsSelector from "@/components/skills/SkillsSelector";

interface JobPostFormProps {
  jobData?: any;
  onJobCreated: () => void;
  onCancel: () => void;
}

const JobPostForm: React.FC<JobPostFormProps> = ({ 
  jobData, 
  onJobCreated, 
  onCancel 
}) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(jobData?.title || "");
  const [description, setDescription] = useState(jobData?.description || "");
  const [location, setLocation] = useState(jobData?.location || "");
  const [isRemote, setIsRemote] = useState(jobData?.is_remote || false);
  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);
  const [skillImportance, setSkillImportance] = useState<Record<string, number>>({});
  const isEditing = !!jobData;

  useEffect(() => {
    if (isEditing) {
      fetchJobSkills();
    }
  }, [isEditing, jobData]);

  const fetchJobSkills = async () => {
    try {
      const { data, error } = await supabase
        .from("job_skills")
        .select("*, skills(*)")
        .eq("job_id", jobData.id);

      if (error) {
        throw error;
      }

      if (data) {
        const skills = data.map((item) => ({
          id: item.skills.id,
          name: item.skills.name,
          description: item.skills.description
        }));
        
        const importanceMap: Record<string, number> = {};
        data.forEach((item) => {
          importanceMap[item.skill_id] = item.importance;
        });
        
        setSelectedSkills(skills);
        setSkillImportance(importanceMap);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching job skills",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedSkills.length === 0) {
      toast({
        title: "No skills selected",
        description: "Please select at least one required skill for this job",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      let jobId;
      
      if (isEditing) {
        // Update existing job
        const { error } = await supabase
          .from("jobs")
          .update({
            title,
            description,
            location,
            is_remote: isRemote,
            updated_at: new Date().toISOString()
          })
          .eq("id", jobData.id);
        
        if (error) throw error;
        jobId = jobData.id;
        
        // Delete existing job skills
        const { error: deleteError } = await supabase
          .from("job_skills")
          .delete()
          .eq("job_id", jobId);
        
        if (deleteError) throw deleteError;
      } else {
        // Create new job
        const { data, error } = await supabase
          .from("jobs")
          .insert({
            employer_id: userProfile.id,
            title,
            description,
            location,
            is_remote: isRemote
          })
          .select();
        
        if (error) throw error;
        jobId = data[0].id;
      }
      
      // Insert job skills
      const jobSkills = selectedSkills.map((skill) => ({
        job_id: jobId,
        skill_id: skill.id,
        importance: skillImportance[skill.id] || 3 // Default to medium importance
      }));
      
      const { error: skillsError } = await supabase
        .from("job_skills")
        .insert(jobSkills);
      
      if (skillsError) throw skillsError;
      
      onJobCreated();
    } catch (error: any) {
      toast({
        title: `Error ${isEditing ? 'updating' : 'creating'} job`,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkillSelected = (skills: any[]) => {
    setSelectedSkills(skills);
    
    // Initialize importance for new skills
    const newImportance = { ...skillImportance };
    skills.forEach((skill) => {
      if (!newImportance[skill.id]) {
        newImportance[skill.id] = 3; // Default to medium importance
      }
    });
    
    setSkillImportance(newImportance);
  };

  const handleImportanceChange = (skillId: string, importance: number) => {
    setSkillImportance({
      ...skillImportance,
      [skillId]: importance
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Job Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Frontend Developer"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Job Description *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the job responsibilities, qualifications, and any other relevant information..."
          className="min-h-[150px]"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. New York, NY"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isRemote"
          checked={isRemote}
          onCheckedChange={(checked) => setIsRemote(checked as boolean)}
        />
        <Label htmlFor="isRemote" className="cursor-pointer">This is a remote position</Label>
      </div>
      
      <div className="space-y-3">
        <Label>Required Skills *</Label>
        <SkillsSelector
          selectedSkills={selectedSkills}
          onSkillsChange={handleSkillSelected}
        />
        
        {selectedSkills.length > 0 && (
          <div className="mt-4">
            <Label>Skill Importance</Label>
            <div className="space-y-3 mt-2">
              {selectedSkills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between">
                  <span>{skill.name}</span>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          skillImportance[skill.id] >= level
                            ? "bg-primary text-primary-foreground"
                            : "bg-gray-200 text-gray-500"
                        }`}
                        onClick={() => handleImportanceChange(skill.id, level)}
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
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
              {isEditing ? "Updating..." : "Posting..."}
            </span>
          ) : (
            isEditing ? "Update Job" : "Post Job"
          )}
        </Button>
      </div>
    </form>
  );
};

export default JobPostForm;
