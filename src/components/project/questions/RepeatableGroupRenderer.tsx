
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, CreditCard, Home, AlertTriangle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import RepeatableGroupModal from './RepeatableGroupModal';
import { useRepeatableGroups } from '@/hooks/useRepeatableGroups';

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

interface RepeatableGroupRendererProps {
  item: QuestionItem;
  onChange: (value: any) => void;
}

const RepeatableGroupRenderer = ({ item, onChange }: RepeatableGroupRendererProps) => {
  const { projectId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
  
  // Check if target table is missing
  if (!item.repeatableGroupTargetTable) {
    console.error('❌ RepeatableGroupRenderer: Missing target table for item:', {
      id: item.id,
      itemName: item.itemName,
      subcategory: item.subcategory
    });
    
    return (
      <Card className="w-full border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <div className="font-medium">Configuration Error</div>
              <div className="text-sm text-muted-foreground">
                Target table not configured for repeatable group "{item.itemName}".
                Please contact your administrator.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    refreshGroups
  } = useRepeatableGroups(projectId!, item.repeatableGroupTargetTable!, item.subcategory!);

  const getIcon = () => {
    switch (item.repeatableGroupTargetTable) {
      case 'project_secondary_income_items':
        return <CreditCard className="h-8 w-8 text-blue-500" />;
      case 'project_dependent_items':
        return <Users className="h-8 w-8 text-green-500" />;
      case 'project_debt_items':
        return <Home className="h-8 w-8 text-orange-500" />;
      default:
        return <Plus className="h-8 w-8 text-gray-500" />;
    }
  };

  const handleStartNew = () => {
    setEditingGroupIndex(null);
    setIsModalOpen(true);
  };

  const handleEditGroup = (groupIndex: number) => {
    setEditingGroupIndex(groupIndex);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingGroupIndex(null);
    refreshGroups();
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-xl">
            {item.repeatableGroupTitle || item.itemName}
          </CardTitle>
          {item.repeatableGroupSubtitle && (
            <p className="text-muted-foreground">
              {item.repeatableGroupSubtitle}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {groups.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">
                Current Entries ({groups.length})
              </h4>
              {groups.map((group, index) => (
                <Card key={group.id} className="cursor-pointer hover:bg-gray-50" 
                      onClick={() => handleEditGroup(index)}>
                  <CardContent className="p-3">
                    <div className="text-sm font-medium">
                      Entry #{index + 1}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {group.completedQuestions} of {group.totalQuestions} questions completed
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                variant="outline"
                onClick={handleStartNew}
                className="w-full mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                {item.repeatableGroupTopButtonText || 'Add Another'}
              </Button>
            </div>
          )}
          
          {groups.length === 0 && (
            <Button
              onClick={handleStartNew}
              className="w-full"
              size="lg"
            >
              {item.repeatableGroupStartButtonText || 'Start'}
            </Button>
          )}
        </CardContent>
      </Card>

      <RepeatableGroupModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        item={item}
        groupIndex={editingGroupIndex}
        existingGroup={editingGroupIndex !== null ? groups[editingGroupIndex] : undefined}
      />
    </div>
  );
};

export default RepeatableGroupRenderer;
