
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface JobDetailsSectionProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  isRemote: boolean;
  setIsRemote: (value: boolean) => void;
}

const JobDetailsSection: React.FC<JobDetailsSectionProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  location,
  setLocation,
  isRemote,
  setIsRemote,
}) => {
  return (
    <>
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
    </>
  );
};

export default JobDetailsSection;
