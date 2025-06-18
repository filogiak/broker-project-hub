
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Save } from 'lucide-react';
import QuestionRenderer from './QuestionRenderer';
import { useSimpleGroupQuestions } from '@/hooks/useSimpleGroupQuestions';
import { useParams } from 'react-router-dom';

interface QuestionItem {
  id: string;
  itemId: string;
  itemName: string;
  itemType: string;
  repeatableGroupTitle?: string;
  repeatableGroupTargetTable?: string;
  subcategory?: string;
}

interface SimpleGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: QuestionItem;
  groupIndex: number | null;
}

const SimpleGroupModal = ({ 
  isOpen, 
  onClose, 
  item, 
  groupIndex 
}: SimpleGroupModalProps) => {
  const { projectId } = useParams();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const {
    questions,
    loading,
    saveAllAnswers
  } = useSimpleGroupQuestions(
    projectId!,
    item.repeatableGroupTargetTable!,
    item.subcategory!,
    groupIndex
  );

  // Load existing answers when modal opens
  useEffect(() => {
    if (isOpen && questions.length > 0) {
      const initialFormData: Record<string, any> = {};
      questions.forEach(question => {
        if (question.currentValue !== undefined && question.currentValue !== null) {
          initialFormData[question.id] = question.currentValue;
        }
      });
      setFormData(initialFormData);
    }
  }, [isOpen, questions]);

  const handleInputChange = (itemId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveAllAnswers(formData);
      onClose();
    } catch (error) {
      console.error('Error saving group:', error);
    } finally {
      setSaving(false);
    }
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
              {groupIndex && ` - Group #${groupIndex}`}
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
              No questions found for this group.
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

export default SimpleGroupModal;
