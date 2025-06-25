
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';
import { useSimpleGroupQuestions } from '@/hooks/useSimpleGroupQuestions';
import QuestionRenderer from './QuestionRenderer';
import type { Database } from '@/integrations/supabase/types';

type ParticipantDesignation = Database['public']['Enums']['participant_designation'];

interface QuestionItem {
  id: string;
  itemId: string;
  itemName: string;
  itemType: string;
  repeatableGroupTitle?: string;
  repeatableGroupSubtitle?: string;
  repeatableGroupTopButtonText?: string;
  repeatableGroupStartButtonText?: string;
  repeatableGroupTargetTable?: string;
  subcategory?: string;
}

interface SimpleGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: QuestionItem;
  groupIndex?: number | null;
  participantDesignation?: ParticipantDesignation;
}

const SimpleGroupModal = ({ 
  isOpen, 
  onClose, 
  item, 
  groupIndex,
  participantDesignation
}: SimpleGroupModalProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const {
    questions,
    loading,
    saveAllAnswers,
    hasUnsavedChanges
  } = useSimpleGroupQuestions(
    item.repeatableGroupTargetTable!,
    item.subcategory!,
    groupIndex || 0,
    participantDesignation
  );

  useEffect(() => {
    if (isOpen && questions.length > 0) {
      const initialData: Record<string, any> = {};
      questions.forEach(question => {
        initialData[question.itemId] = question.currentValue || '';
      });
      setFormData(initialData);
    }
  }, [isOpen, questions]);

  const handleInputChange = (itemId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleSave = async () => {
    if (!item.repeatableGroupTargetTable || groupIndex === null || groupIndex === undefined) {
      return;
    }

    try {
      setSaving(true);
      await saveAllAnswers(formData);
      onClose();
    } catch (error) {
      console.error('Error saving group answers:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                {item.repeatableGroupTitle || item.itemName}
                {groupIndex !== null && groupIndex !== undefined && (
                  <span className="text-muted-foreground ml-2">- Group #{groupIndex}</span>
                )}
              </DialogTitle>
              {participantDesignation && (
                <p className="text-sm text-muted-foreground mt-1">
                  {participantDesignation === 'solo_applicant' ? 'Solo Applicant' :
                   participantDesignation === 'applicant_one' ? 'Applicant 1' :
                   participantDesignation === 'applicant_two' ? 'Applicant 2' : 
                   participantDesignation}
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No questions available for this group.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.itemId} className="space-y-2">
                  <label className="text-sm font-medium">
                    {index + 1}. {question.itemName}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <QuestionRenderer
                    item={{
                      id: question.id,
                      itemId: question.itemId,
                      itemName: question.itemName,
                      itemType: question.itemType,
                      displayValue: question.currentValue,
                      typedValue: question.typedValue
                    } as any}
                    currentValue={formData[question.itemId] || question.currentValue || ''}
                    onChange={handleInputChange}
                    isAdditional={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || loading || questions.length === 0}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Group'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleGroupModal;
