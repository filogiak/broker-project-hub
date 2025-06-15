
import { useState, useEffect } from 'react';
import { ChecklistItemService, TypedChecklistItem, TypedChecklistItemValue } from '@/services/checklistItemService';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type ParticipantDesignation = Database['public']['Enums']['participant_designation'];
type ChecklistStatus = Database['public']['Enums']['checklist_status'];

export const useTypedChecklistItems = (
  projectId: string,
  categoryId?: string,
  participantDesignation?: ParticipantDesignation
) => {
  const [items, setItems] = useState<TypedChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      let result;
      if (categoryId) {
        result = await ChecklistItemService.getChecklistItemsByCategory(
          projectId,
          categoryId,
          participantDesignation
        );
      } else {
        result = await ChecklistItemService.getProjectChecklistItems(
          projectId,
          participantDesignation
        );
      }

      if (result.error) {
        setError(result.error.message);
        toast({
          title: "Error loading checklist items",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        setItems(result.data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error loading checklist items",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (
    itemId: string,
    value: TypedChecklistItemValue
  ): Promise<boolean> => {
    try {
      const result = await ChecklistItemService.createChecklistItem(
        projectId,
        itemId,
        value,
        participantDesignation
      );

      if (result.error) {
        toast({
          title: "Error creating checklist item",
          description: result.error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Item created",
        description: "Checklist item has been created successfully.",
      });
      
      await fetchItems(); // Refresh the list
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast({
        title: "Error creating checklist item",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateItem = async (
    itemId: string,
    value: TypedChecklistItemValue,
    status?: ChecklistStatus
  ): Promise<boolean> => {
    try {
      const result = await ChecklistItemService.updateChecklistItem(
        itemId,
        value,
        status
      );

      if (result.error) {
        toast({
          title: "Error updating checklist item",
          description: result.error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Item updated",
        description: "Checklist item has been updated successfully.",
      });
      
      await fetchItems(); // Refresh the list
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast({
        title: "Error updating checklist item",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const validateAndConvertValue = (itemType: Database['public']['Enums']['item_type'], inputValue: any) => {
    try {
      return ChecklistItemService.validateAndConvertValue(itemType, inputValue);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Validation error';
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchItems();
    }
  }, [projectId, categoryId, participantDesignation]);

  return {
    items,
    loading,
    error,
    createItem,
    updateItem,
    validateAndConvertValue,
    refreshItems: fetchItems,
  };
};
