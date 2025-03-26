
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface JobSkillsListProps {
  jobId: string;
}

const JobSkillsList: React.FC<JobSkillsListProps> = ({ jobId }) => {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobSkills();
  }, [jobId]);

  const fetchJobSkills = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("job_skills")
        .select("*, skills(*)")
        .eq("job_id", jobId);

      if (error) {
        throw error;
      }

      setSkills(data || []);
    } catch (error) {
      console.error("Error fetching job skills:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex space-x-2">
      {[1, 2, 3].map(i => (
        <Badge key={i} variant="outline" className="bg-gray-100 animate-pulse h-5 w-16"></Badge>
      ))}
    </div>;
  }

  if (skills.length === 0) {
    return <p className="text-sm text-gray-500">No specific skills required</p>;
  }

  // Function to get color based on importance
  const getImportanceColor = (importance: number) => {
    switch (importance) {
      case 5: return "bg-red-100 text-red-800 hover:bg-red-100";
      case 4: return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      case 3: return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case 2: return "bg-green-100 text-green-800 hover:bg-green-100";
      case 1: return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <Badge 
          key={skill.skill_id} 
          variant="outline"
          className={getImportanceColor(skill.importance)}
        >
          {skill.skills.name}
        </Badge>
      ))}
    </div>
  );
};

export default JobSkillsList;
