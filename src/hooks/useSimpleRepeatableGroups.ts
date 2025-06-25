
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SimpleRepeatableGroupService } from '@/services/simpleRepeatableGroupService';
import type { Database } from '@/integrations/supabase/types';

type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

interface SimpleRepeatableGroup {
  groupIndex: number;
  completedQuestions: number;
  totalQuestions: number;
  questions: Array<{
    itemId: string;
    value: any;
    status: string;
  }>;
}

export const useSimpleRepeatableGroups = (
  projectId: string,
  targetTable: string,
  subcategory: string,
  participantDesignation?: ParticipantDesignation
) => {
  const [groups, setGroups] = useState<SimpleRepeatableGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadGroups = useCallback(async () => {
    if (!projectId || !targetTable) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await SimpleRepeatableGroupService.loadAllGroups(
        projectId, 
        targetTable, 
        participantDesignation
      );
      
      if (error) throw error;

      // Group by group_index (mirrors project_checklist_items processing)
      const groupedData = data?.reduce((acc, item) => {
        const groupIndex = item.group_index;
        if (!acc[groupIndex]) {
          acc[groupIndex] = {
            groupIndex,
            questions: [],
            completedQuestions: 0,
            totalQuestions: 0
          };
        }
        
        const hasValue = item.text_value || 
                        item.numeric_value || 
                        item.boolean_value || 
                        item.date_value || 
                        item.json_value;
        
        acc[groupIndex].questions.push({
          itemId: item.item_id,
          value: hasValue,
          status: item.status
        });
        
        acc[groupIndex].totalQuestions++;
        if (hasValue && (item.status === 'submitted' || item.status === 'approved')) {
          acc[groupIndex].completedQuestions++;
        }
        
        return acc;
      }, {} as Record<number, SimpleRepeatableGroup>) || {};

      const groupsArray = Object.values(groupedData).sort((a, b) => a.groupIndex - b.groupIndex);
      setGroups(groupsArray);

    } catch (error) {
      console.error('Error loading simple repeatable groups:', error);
      toast({
        title: "Error loading groups",
        description: "Failed to load groups.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, targetTable, participantDesignation, toast]);

  const createGroup = async () => {
    try {
      console.log('Creating new group for participant:', participantDesignation);
      
      const groupIndex = await SimpleRepeatableGroupService.createNewGroup(
        projectId, 
        targetTable, 
        subcategory,
        participantDesignation
      );
      
      toast({
        title: "Group created",
        description: `Group ${groupIndex} has been created.`,
      });
      
      await loadGroups();
      return groupIndex;
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error creating group",
        description: "Failed to create new group.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteGroup = async (groupIndex: number) => {
    try {
      console.log('Deleting group', groupIndex, 'for participant:', participantDesignation);
      
      const { error } = await SimpleRepeatableGroupService.deleteGroup(
        projectId, 
        targetTable, 
        groupIndex,
        participantDesignation
      );
      
      if (error) throw error;
      
      toast({
        title: "Group deleted",
        description: `Group ${groupIndex} has been deleted.`,
      });
      
      await loadGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error deleting group",
        description: "Failed to delete group.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Cleanup empty groups (called on page exit)
  const cleanupEmptyGroups = async () => {
    try {
      for (const group of groups) {
        const hasAnswers = await SimpleRepeatableGroupService.groupHasAnswers(
          projectId, 
          targetTable, 
          group.groupIndex,
          participantDesignation
        );
        
        if (!hasAnswers) {
          await SimpleRepeatableGroupService.deleteGroup(
            projectId, 
            targetTable, 
            group.groupIndex,
            participantDesignation
          );
          console.log(`Cleaned up empty group ${group.groupIndex} for participant:`, participantDesignation);
        }
      }
      
      await loadGroups();
    } catch (error) {
      console.error('Error cleaning up empty groups:', error);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Note: This runs on unmount, but might not catch all page exits
      // Consider adding window beforeunload listener if needed
      cleanupEmptyGroups();
    };
  }, []);

  return {
    groups,
    loading,
    createGroup,
    deleteGroup,
    cleanupEmptyGroups,
    refreshGroups: loadGroups
  };
};
