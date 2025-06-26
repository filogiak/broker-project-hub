
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CategoryIconService } from '@/services/categoryIconService';
import type { CategoryCompletionInfo } from '@/services/categoryCompletionService';

interface CategoryBoxProps {
  name: string;
  onClick: () => void;
  completion?: CategoryCompletionInfo;
}

const CategoryBox = ({ name, onClick, completion }: CategoryBoxProps) => {
  const IconComponent = CategoryIconService.getIconForCategory(name);
  
  const completionPercentage = completion?.completionPercentage || 0;
  const isComplete = completion?.isComplete || false;

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/30 bg-white"
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Top section with icon and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>
          
          {!isComplete && (
            <Badge variant="outline" className="bg-accent-yellow text-primary border-accent-yellow font-medium">
              Incomplet {completionPercentage}%
            </Badge>
          )}
        </div>

        {/* Content section */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
            <p className="text-sm text-gray-600">
              {completion ? `${completion.completedItems}/${completion.totalItems} items completed` : 'Click to view details'}
            </p>
          </div>

          {/* Progress bar */}
          {completion && (
            <div className="space-y-2">
              <Progress 
                value={completionPercentage} 
                className="h-2 bg-gray-200"
              />
              <p className="text-xs text-gray-500 text-right">
                {completionPercentage}% complete
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryBox;
