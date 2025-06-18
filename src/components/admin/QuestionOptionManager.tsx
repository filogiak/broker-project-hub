
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { questionService } from '@/services/questionService';

interface QuestionOption {
  id?: string;
  option_value: string;
  option_label: string;
  display_order: number;
}

interface QuestionOptionManagerProps {
  question: any;
}

const QuestionOptionManager = ({ question }: QuestionOptionManagerProps) => {
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [editingOption, setEditingOption] = useState<QuestionOption | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOptions();
  }, [question.id]);

  const loadOptions = async () => {
    try {
      setLoading(true);
      const data = await questionService.getItemOptions(question.id);
      setOptions(data || []);
    } catch (error) {
      console.error('Error loading options:', error);
      toast.error('Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOption = async (optionData: any) => {
    try {
      if (editingOption) {
        await questionService.updateItemOption(editingOption.id, optionData);
        toast.success('Option updated successfully');
      } else {
        await questionService.createItemOption({
          ...optionData,
          item_id: question.id,
        });
        toast.success('Option created successfully');
      }
      
      loadOptions();
      setEditingOption(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving option:', error);
      toast.error('Failed to save option');
    }
  };

  const updateOptions = (newOptions: QuestionOption[]) => {
    // Update display_order based on array position
    const updatedOptions = newOptions.map((option, index) => ({
      ...option,
      display_order: index
    }));
    setOptions(updatedOptions);
  };

  const addOption = () => {
    const newOption: QuestionOption = {
      option_value: '',
      option_label: '',
      display_order: options.length
    };
    updateOptions([...options, newOption]);
  };

  const updateOption = (index: number, field: 'option_value' | 'option_label', value: string) => {
    const updated = options.map((option, i) => 
      i === index ? { ...option, [field]: value } : option
    );
    updateOptions(updated);
  };

  const removeOption = (index: number) => {
    const updated = options.filter((_, i) => i !== index);
    updateOptions(updated);
  };

  const moveOption = (fromIndex: number, toIndex: number) => {
    const updated = [...options];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    updateOptions(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Question Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
            <div className="cursor-move">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Value</label>
                <Input
                  value={option.option_value}
                  onChange={(e) => updateOption(index, 'option_value', e.target.value)}
                  placeholder="Option value (stored in database)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Label</label>
                <Input
                  value={option.option_label}
                  onChange={(e) => updateOption(index, 'option_label', e.target.value)}
                  placeholder="Option label (displayed to user)"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeOption(index)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        <Button onClick={addOption} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
        
        {options.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            No options added yet. Click "Add Option" to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionOptionManager;
