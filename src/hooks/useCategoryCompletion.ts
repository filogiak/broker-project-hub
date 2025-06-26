
import { useState, useEffect } from 'react';
import { CategoryCompletionService, type CategoryCompletionInfo } from '@/services/categoryCompletionService';
import type { Database } from '@/integrations/supabase/types';

type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

export const useCategoryCompletion = (
  projectId: string,
  categories: Array<{ id: string; name: string }>,
  participantDesignation?: ParticipantDesignation
) => {
  const [completionData, setCompletionData] = useState<CategoryCompletionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletionData = async () => {
      if (!projectId || !categories.length) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await CategoryCompletionService.getAllCategoriesCompletion(
          projectId,
          categories,
          participantDesignation
        );
        setCompletionData(data);
      } catch (error) {
        console.error('Error fetching category completion data:', error);
        setCompletionData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletionData();
  }, [projectId, categories, participantDesignation]);

  const getCompletionForCategory = (categoryId: string): CategoryCompletionInfo | undefined => {
    return completionData.find(item => item.categoryId === categoryId);
  };

  const overallCompletion = {
    totalItems: completionData.reduce((sum, item) => sum + item.totalItems, 0),
    completedItems: completionData.reduce((sum, item) => sum + item.completedItems, 0),
    completionPercentage: completionData.length > 0 
      ? Math.round((completionData.reduce((sum, item) => sum + item.completedItems, 0) / 
                   completionData.reduce((sum, item) => sum + item.totalItems, 0)) * 100) || 0
      : 0
  };

  return {
    completionData,
    loading,
    getCompletionForCategory,
    overallCompletion
  };
};
