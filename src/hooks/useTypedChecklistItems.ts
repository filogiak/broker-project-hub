
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

      console.log('Fetching items with params:', {
        projectId,
        categoryId,
        participantDesignation
      });

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

      console.log('Raw result from service:', result);

      if (result.error) {
        setError(result.error.message);
        toast({
          title: "Error loading checklist items",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        console.log('Setting items:', result.data);
        setItems(result.data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Hook error:', err);
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
        console.error('Create item error:', result.error);
        toast({
          title: "Error creating checklist item",
          description: result.error.message,
          variant: "destructive",
        });
        return false;
      }

      console.log('Successfully created item:', result.data);
      toast({
        title: "Item created",
        description: "Checklist item has been created successfully.",
      });
      
      await fetchItems(); // Refresh the list
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Create item exception:', err);
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
      console.log(`Updating item ${itemId} with value:`, value, 'status:', status);
      
      const result = await ChecklistItemService.updateChecklistItem(
        itemId,
        value,
        status
      );

      if (result.error) {
        console.error('Update item error:', result.error);
        toast({
          title: "Error updating checklist item",
          description: result.error.message,
          variant: "destructive",
        });
        return false;
      }

      console.log('Successfully updated item:', result.data);
      
      // Don't show success toast for individual updates to avoid spam
      // The calling code will show a summary toast
      
      await fetchItems(); // Refresh the list
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Update item exception:', err);
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
      console.log(`Validating ${itemType} with value:`, inputValue);
      const result = ChecklistItemService.validateAndConvertValue(itemType, inputValue);
      console.log(`Validation result:`, result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Validation error';
      console.error('Validation error:', err);
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
