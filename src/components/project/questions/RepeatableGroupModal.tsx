
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Save, Users, DollarSign, CreditCard, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { TypedChecklistItem } from '@/services/checklistItemService';

interface RepeatableGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: TypedChecklistItem;
  projectId: string;
  participantDesignation?: string;
  onSave: (data: any) => void;
}

interface GroupEntry {
  id: string;
  data: Record<string, any>;
  isNew?: boolean;
}

const RepeatableGroupModal: React.FC<RepeatableGroupModalProps> = ({
  isOpen,
  onClose,
  item,
  projectId,
  participantDesignation,
  onSave,
}) => {
  const [entries, setEntries] = useState<GroupEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<GroupEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get the appropriate icon based on target table
  const getIcon = () => {
    switch (item.repeatable_group_target_table) {
      case 'project_secondary_incomes':
        return <DollarSign className="h-5 w-5" />;
      case 'project_dependents':
        return <Users className="h-5 w-5" />;
      case 'project_debts':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Plus className="h-5 w-5" />;
    }
  };

  // Sample fields based on target table (this would be dynamic in real implementation)
  const getFormFields = () => {
    switch (item.repeatable_group_target_table) {
      case 'project_secondary_incomes':
        return [
          { key: 'income_type', label: 'Income Type', type: 'select', options: ['Rental Income', 'Investment Income', 'Side Business', 'Other'] },
          { key: 'monthly_amount', label: 'Monthly Amount', type: 'number' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ];
      case 'project_dependents':
        return [
          { key: 'name', label: 'Full Name', type: 'text' },
          { key: 'relationship', label: 'Relationship', type: 'select', options: ['Child', 'Spouse', 'Parent', 'Other'] },
          { key: 'age', label: 'Age', type: 'number' },
          { key: 'dependent_type', label: 'Dependency Type', type: 'select', options: ['Financial', 'Legal', 'Both'] },
        ];
      case 'project_debts':
        return [
          { key: 'debt_type', label: 'Debt Type', type: 'select', options: ['Credit Card', 'Student Loan', 'Auto Loan', 'Personal Loan', 'Other'] },
          { key: 'creditor_name', label: 'Creditor Name', type: 'text' },
          { key: 'outstanding_balance', label: 'Outstanding Balance', type: 'number' },
          { key: 'monthly_payment', label: 'Monthly Payment', type: 'number' },
        ];
      default:
        return [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'value', label: 'Value', type: 'text' },
        ];
    }
  };

  const formFields = getFormFields();

  const handleAddNew = () => {
    const newEntry: GroupEntry = {
      id: `new_${Date.now()}`,
      data: {},
      isNew: true,
    };
    setCurrentEntry(newEntry);
    setIsEditing(true);
  };

  const handleEdit = (entry: GroupEntry) => {
    setCurrentEntry(entry);
    setIsEditing(true);
  };

  const handleSaveEntry = async () => {
    if (!currentEntry) return;

    try {
      setSaving(true);
      
      // Validate required fields
      const hasRequiredData = formFields.some(field => 
        currentEntry.data[field.key] && currentEntry.data[field.key] !== ''
      );
      
      if (!hasRequiredData) {
        toast.error('Please fill in at least one field');
        return;
      }

      if (currentEntry.isNew) {
        // Add new entry
        const updatedEntries = [...entries, { ...currentEntry, isNew: false }];
        setEntries(updatedEntries);
        toast.success('Entry added successfully');
      } else {
        // Update existing entry
        const updatedEntries = entries.map(entry => 
          entry.id === currentEntry.id ? currentEntry : entry
        );
        setEntries(updatedEntries);
        toast.success('Entry updated successfully');
      }

      setCurrentEntry(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    setEntries(updatedEntries);
    toast.success('Entry deleted successfully');
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    if (!currentEntry) return;
    
    setCurrentEntry({
      ...currentEntry,
      data: {
        ...currentEntry.data,
        [fieldKey]: value,
      },
    });
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      
      // In a real implementation, this would save to the database
      // For now, we'll just pass the data back to the parent
      onSave({
        entries: entries,
        targetTable: item.repeatable_group_target_table,
      });
      
      toast.success(`${entries.length} entries saved successfully`);
      onClose();
    } catch (error) {
      console.error('Error saving all entries:', error);
      toast.error('Failed to save entries');
    } finally {
      setSaving(false);
    }
  };

  const renderFormField = (field: any) => {
    const value = currentEntry?.data[field.key] || '';

    switch (field.type) {
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.key, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={3}
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {item.repeatable_group_title || item.itemName}
          </DialogTitle>
          {item.repeatable_group_subtitle && (
            <DialogDescription>
              {item.repeatable_group_subtitle}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Entry editing form */}
          {isEditing && currentEntry && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{currentEntry.isNew ? 'Add New Entry' : 'Edit Entry'}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentEntry(null);
                      setIsEditing(false);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    {renderFormField(field)}
                  </div>
                ))}
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveEntry} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Entry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* List of existing entries */}
          {!isEditing && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {entries.length > 0 ? `${entries.length} entries` : 'No entries yet'}
                </h3>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  {item.repeatable_group_top_button_text || 'Add Entry'}
                </Button>
              </div>

              {entries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    {getIcon()}
                  </div>
                  <p>No entries added yet. Click "Add Entry" to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry, index) => (
                    <Card key={entry.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">Entry {index + 1}</h4>
                            <div className="text-sm text-muted-foreground mt-1">
                              {Object.entries(entry.data)
                                .filter(([_, value]) => value && value !== '')
                                .slice(0, 2)
                                .map(([key, value]) => {
                                  const field = formFields.find(f => f.key === key);
                                  return `${field?.label}: ${value}`;
                                })
                                .join(' • ')}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(entry)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {entries.length > 0 && (
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveAll} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    Save All ({entries.length} entries)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RepeatableGroupModal;
