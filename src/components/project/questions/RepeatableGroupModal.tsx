
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Save } from 'lucide-react';
import QuestionRenderer from './QuestionRenderer';
import { useRepeatableGroupQuestions } from '@/hooks/useRepeatableGroupQuestions';

interface QuestionItem {
  id: string;
  itemId: string;
  itemName: string;
  itemType: string;
  repeatableGroupTitle?: string;
  repeatableGroupTargetTable?: string;
  subcategory?: string;
}

interface GroupData {
  id: string;
  completedQuestions: number;
  totalQuestions: number;
}

interface RepeatableGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: QuestionItem;
  groupIndex: number | null;
  existingGroup?: GroupData;
}

const RepeatableGroupModal = ({ 
  isOpen, 
  onClose, 
  item, 
  groupIndex,
  existingGroup 
}: RepeatableGroupModalProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const {
    questions,
    loading,
    saveAnswers,
    loadExistingAnswers
  } = useRepeatableGroupQuestions(
    item.repeatableGroupTargetTable!,
    item.subcategory!,
    groupIndex !== null ? groupIndex + 1 : undefined
  );

  useEffect(() => {
    if (isOpen && existingGroup && groupIndex !== null) {
      loadExistingAnswers(groupIndex + 1).then(data => {
        setFormData(data);
      });
    } else if (isOpen && groupIndex === null) {
      setFormData({});
    }
  }, [isOpen, existingGroup, groupIndex, loadExistingAnswers]);

  const handleInputChange = (itemId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const targetGroupIndex = groupIndex !== null ? groupIndex + 1 : await getNextGroupIndex();
      await saveAnswers(formData, targetGroupIndex);
      onClose();
    } catch (error) {
      console.error('Error saving repeatable group:', error);
    } finally {
      setSaving(false);
    }
  };

  const getNextGroupIndex = async () => {
    // This would typically query the database to get the next available group_index
    // For now, we'll use a simple increment
    return Date.now(); // Temporary solution
  };

  const completedQuestions = Object.keys(formData).filter(key => 
    formData[key] !== undefined && formData[key] !== ''
  ).length;

  const progressPercentage = questions.length > 0 
    ? Math.round((completedQuestions / questions.length) * 100)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {item.repeatableGroupTitle || item.itemName}
              {groupIndex !== null && ` - Entry #${groupIndex + 1}`}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{completedQuestions} of {questions.length} completed</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading questions...</div>
            </div>
          ) : questions.length > 0 ? (
            questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <label className="text-sm font-medium">
                  {question.itemName}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                <QuestionRenderer
                  item={question}
                  currentValue={formData[question.id]}
                  onChange={handleInputChange}
                  isAdditional={false}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No questions found for this group. Please check the question setup.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || questions.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RepeatableGroupModal;
