
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RepeatableGroupService } from '@/services/repeatableGroupService';

interface RepeatableGroup {
  id: string;
  completedQuestions: number;
  totalQuestions: number;
  groupIndex: number;
}

export const useRepeatableGroups = (
  projectId: string,
  targetTable: string,
  subcategory: string
) => {
  const [groups, setGroups] = useState<RepeatableGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refreshGroups = useCallback(async () => {
    if (!projectId || !targetTable || !subcategory) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await RepeatableGroupService.loadGroups(projectId, targetTable);

      if (error) throw error;

      // Group by group_index and calculate completion stats
      const groupedData = data?.reduce((acc, item) => {
        const groupIndex = item.group_index;
        if (!acc[groupIndex]) {
          acc[groupIndex] = {
            id: `group_${groupIndex}`,
            groupIndex,
            items: [],
            completedQuestions: 0,
            totalQuestions: 0
          };
        }
        acc[groupIndex].items.push(item);
        acc[groupIndex].totalQuestions++;
        if (item.status === 'submitted' || item.status === 'approved') {
          acc[groupIndex].completedQuestions++;
        }
        return acc;
      }, {} as Record<number, any>) || {};

      const groupsArray = Object.values(groupedData) as RepeatableGroup[];
      setGroups(groupsArray);

    } catch (error) {
      console.error('Error loading repeatable groups:', error);
      toast({
        title: "Error loading groups",
        description: "Failed to load existing groups.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, targetTable, subcategory, toast]);

  const createGroup = async (formData: Record<string, any>) => {
    try {
      console.log('Creating new group with data:', formData);
      
      // Get the next available group index
      const newGroupIndex = await RepeatableGroupService.createNewGroup(projectId, targetTable);
      
      // This will be handled by the modal's save logic
      // The formData will be saved through useRepeatableGroupQuestions
      
      toast({
        title: "Group created",
        description: "New group has been created successfully.",
      });
      
      await refreshGroups();
      return newGroupIndex;
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

  const updateGroup = async (groupIndex: number, formData: Record<string, any>) => {
    try {
      console.log('Updating group', groupIndex, 'with data:', formData);
      
      // This will be handled by the modal's save logic
      // The formData will be saved through useRepeatableGroupQuestions
      
      toast({
        title: "Group updated",
        description: "Group has been updated successfully.",
      });
      
      await refreshGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: "Error updating group",
        description: "Failed to update group.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteGroup = async (groupIndex: number) => {
    try {
      console.log('Deleting group', groupIndex);
      
      const { error } = await RepeatableGroupService.deleteGroup(projectId, targetTable, groupIndex);
      
      if (error) throw error;
      
      toast({
        title: "Group deleted",
        description: "Group has been deleted successfully.",
      });
      
      await refreshGroups();
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

  useEffect(() => {
    refreshGroups();
  }, [refreshGroups]);

  return {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    refreshGroups
  };
};
