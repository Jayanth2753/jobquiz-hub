
import React from "react";
import { Button } from "@/components/ui/button";

interface JobFormActionsProps {
  loading: boolean;
  isEditing: boolean;
  onCancel: () => void;
}

const JobFormActions: React.FC<JobFormActionsProps> = ({
  loading,
  isEditing,
  onCancel,
}) => {
  return (
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
  );
};

export default JobFormActions;
