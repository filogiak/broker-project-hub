
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const refreshGroups = async () => {
    if (!projectId || !targetTable || !subcategory) return;

    try {
      setLoading(true);
      
      // Query the target table to get existing groups
      const { data, error } = await supabase
        .from(targetTable)
        .select('group_index, id, status')
        .eq('project_id', projectId)
        .order('group_index', { ascending: true });

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
  };

  const createGroup = async (formData: Record<string, any>) => {
    // This will be implemented when we have the questions ready
    console.log('Creating new group with data:', formData);
  };

  const updateGroup = async (groupIndex: number, formData: Record<string, any>) => {
    // This will be implemented when we have the questions ready
    console.log('Updating group', groupIndex, 'with data:', formData);
  };

  const deleteGroup = async (groupIndex: number) => {
    // This will be implemented when we have the questions ready
    console.log('Deleting group', groupIndex);
  };

  useEffect(() => {
    refreshGroups();
  }, [projectId, targetTable, subcategory]);

  return {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    refreshGroups
  };
};
