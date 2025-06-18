
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, DollarSign, CreditCard } from 'lucide-react';
import type { TypedChecklistItem } from '@/services/checklistItemService';

interface RepeatableGroupRendererProps {
  item: TypedChecklistItem;
  currentValue: any;
  onChange: (itemId: string, value: any) => void;
  projectId: string;
  participantDesignation?: string;
}

const RepeatableGroupRenderer: React.FC<RepeatableGroupRendererProps> = ({
  item,
  currentValue,
  onChange,
  projectId,
  participantDesignation,
}) => {
  const [showModal, setShowModal] = useState(false);

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

  // Get existing groups count (placeholder for now)
  const existingGroupsCount = 0; // This will be implemented in later phases

  const handleStartClick = () => {
    setShowModal(true);
    // Mark as started
    onChange(item.id, 'started');
  };

  const handleAddMore = () => {
    setShowModal(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getIcon()}
          {item.repeatable_group_title || item.itemName}
        </CardTitle>
        {item.repeatable_group_subtitle && (
          <p className="text-sm text-muted-foreground">
            {item.repeatable_group_subtitle}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {existingGroupsCount === 0 ? (
          // First time - show start button
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                {getIcon()}
              </div>
              <p className="text-sm text-muted-foreground">
                Click to start adding {item.repeatable_group_title?.toLowerCase() || 'items'}
              </p>
            </div>
            <Button onClick={handleStartClick} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {item.repeatable_group_start_button_text || 'Start'}
            </Button>
          </div>
        ) : (
          // Has existing groups - show summary and add more button
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {existingGroupsCount} {item.repeatable_group_title?.toLowerCase() || 'items'} added
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click to view or add more
                  </p>
                </div>
                <Button onClick={handleAddMore} size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  {item.repeatable_group_top_button_text || 'Add'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Modal will be implemented in Phase 4 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {item.repeatable_group_title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Modal implementation coming in Phase 4
            </p>
            <Button onClick={() => setShowModal(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default RepeatableGroupRenderer;
