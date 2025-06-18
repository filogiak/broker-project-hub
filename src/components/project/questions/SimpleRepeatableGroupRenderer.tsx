
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, CreditCard, Home, Edit, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useSimpleRepeatableGroups } from '@/hooks/useSimpleRepeatableGroups';
import SimpleGroupModal from './SimpleGroupModal';

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

interface SimpleRepeatableGroupRendererProps {
  item: QuestionItem;
  onChange: (value: any) => void;
}

const SimpleRepeatableGroupRenderer = ({ item, onChange }: SimpleRepeatableGroupRendererProps) => {
  const { projectId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
  
  const {
    groups,
    loading,
    createGroup,
    deleteGroup,
    refreshGroups
  } = useSimpleRepeatableGroups(projectId!, item.repeatableGroupTargetTable!, item.subcategory!);

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

  const handleCreateNew = async () => {
    try {
      const groupIndex = await createGroup();
      setEditingGroupIndex(groupIndex);
      setIsModalOpen(true);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleEditGroup = (groupIndex: number) => {
    setEditingGroupIndex(groupIndex);
    setIsModalOpen(true);
  };

  const handleDeleteGroup = async (groupIndex: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete Group ${groupIndex}?`)) {
      await deleteGroup(groupIndex);
    }
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
              {groups.map((group) => (
                <Card 
                  key={group.groupIndex} 
                  className="cursor-pointer hover:bg-gray-50 relative" 
                  onClick={() => handleEditGroup(group.groupIndex)}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          Group #{group.groupIndex}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {group.completedQuestions} of {group.totalQuestions} questions completed
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditGroup(group.groupIndex);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteGroup(group.groupIndex, e)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                variant="outline"
                onClick={handleCreateNew}
                className="w-full mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                {item.repeatableGroupTopButtonText || 'Add Another'}
              </Button>
            </div>
          )}
          
          {groups.length === 0 && (
            <Button
              onClick={handleCreateNew}
              className="w-full"
              size="lg"
            >
              {item.repeatableGroupStartButtonText || 'Start'}
            </Button>
          )}
        </CardContent>
      </Card>

      <SimpleGroupModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        item={item}
        groupIndex={editingGroupIndex}
      />
    </div>
  );
};

export default SimpleRepeatableGroupRenderer;
