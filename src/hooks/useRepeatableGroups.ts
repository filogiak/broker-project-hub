
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
    console.log('Creating new group with data:', formData);
  };

  const updateGroup = async (groupIndex: number, formData: Record<string, any>) => {
    console.log('Updating group', groupIndex, 'with data:', formData);
  };

  const deleteGroup = async (groupIndex: number) => {
    console.log('Deleting group', groupIndex);
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
