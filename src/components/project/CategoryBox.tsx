
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      className="gomutuo-card-hover cursor-pointer border-2 hover:border-form-green/30 animate-fade-in"
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Top section with icon and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-vibe-green-light flex items-center justify-center">
            <IconComponent className="h-6 w-6 text-form-green" />
          </div>
          
          {!isComplete && (
            <Badge className="gomutuo-badge-incomplete text-xs font-medium px-2 py-1">
              Incomplet {completionPercentage}%
            </Badge>
          )}
          
          {isComplete && (
            <Badge className="bg-vibe-green-vivid text-white border-vibe-green-vivid font-medium text-xs px-2 py-1">
              Completo
            </Badge>
          )}
        </div>

        {/* Content section */}
        <div className="space-y-3">
          <div>
            <h3 className="gomutuo-heading text-lg mb-1">{name}</h3>
            <p className="gomutuo-text text-sm">
              {completion ? `${completion.completedItems}/${completion.totalItems} elementi completati` : 'Clicca per visualizzare i dettagli'}
            </p>
          </div>

          {/* Progress bar */}
          {completion && (
            <div className="space-y-2">
              <div className="gomutuo-progress-bar">
                <div 
                  className="gomutuo-progress-fill"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-right font-inter">
                {completionPercentage}% completo
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryBox;
