
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import JobDetailsSection from "./JobDetailsSection";
import JobSkillsSection from "./JobSkillsSection";
import JobFormActions from "./JobFormActions";

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <JobDetailsSection
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        location={location}
        setLocation={setLocation}
        isRemote={isRemote}
        setIsRemote={setIsRemote}
      />
      
      <JobSkillsSection
        selectedSkills={selectedSkills}
        skillImportance={skillImportance}
        onSkillsChange={handleSkillSelected}
        onImportanceChange={handleImportanceChange}
      />
      
      <JobFormActions
        loading={loading}
        isEditing={isEditing}
        onCancel={onCancel}
      />
    </form>
  );
};

export default JobPostForm;
