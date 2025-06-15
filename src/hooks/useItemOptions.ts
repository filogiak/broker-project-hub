
import { useState, useEffect } from 'react';
import { questionService } from '@/services/questionService';
import { useToast } from '@/hooks/use-toast';

interface ItemOption {
  id: string;
  value: string;
  label: string;
  displayOrder: number;
}

export const useItemOptions = (itemId: string) => {
  const [options, setOptions] = useState<ItemOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOptions = async () => {
      if (!itemId) return;

      try {
        setLoading(true);
        setError(null);
        
        const fetchedOptions = await questionService.getItemOptions(itemId);
        
        const mappedOptions = fetchedOptions.map(option => ({
          id: option.id,
          value: option.option_value,
          label: option.option_label,
          displayOrder: option.display_order || 0
        }));

        // Sort by display order
        mappedOptions.sort((a, b) => a.displayOrder - b.displayOrder);
        
        setOptions(mappedOptions);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load options';
        setError(errorMessage);
        toast({
          title: "Error loading options",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [itemId, toast]);

  return { options, loading, error };
};
