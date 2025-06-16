
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useItemOptions } from './useItemOptions';

interface TriggerItemDetails {
  id: string;
  itemName: string;
  itemType: string;
  hasOptions: boolean;
}

export const useTriggerItemDetails = (triggerItemId: string) => {
  const [itemDetails, setItemDetails] = useState<TriggerItemDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const { options, loading: optionsLoading } = useItemOptions(triggerItemId);

  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!triggerItemId) {
        setItemDetails(null);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('required_items')
          .select('id, item_name, item_type')
          .eq('id', triggerItemId)
          .single();

        if (error) throw error;

        setItemDetails({
          id: data.id,
          itemName: data.item_name,
          itemType: data.item_type,
          hasOptions: data.item_type === 'single_choice_dropdown'
        });
      } catch (error) {
        console.error('Error fetching trigger item details:', error);
        setItemDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [triggerItemId]);

  return {
    itemDetails,
    options: itemDetails?.hasOptions ? options : [],
    loading: loading || optionsLoading,
  };
};
