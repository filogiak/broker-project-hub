
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
      className="cursor-pointer bg-white border border-gray-100 hover:border-form-green/20 transition-all duration-200 screenshot-card-shadow hover:screenshot-card-shadow-hover hover:-translate-y-1 rounded-[12px]"
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Top section with icon and status */}
        <div className="flex items-start justify-between mb-6">
          <div className="w-14 h-14 rounded-[10px] bg-vibe-green-light flex items-center justify-center">
            <IconComponent className="h-7 w-7 text-form-green" />
          </div>
          
          {!isComplete && (
            <Badge className="bg-accent-yellow text-form-green border-accent-yellow font-medium text-xs px-3 py-1 rounded-[8px] font-dm-sans">
              Incompleto {completionPercentage}%
            </Badge>
          )}
          
          {isComplete && (
            <Badge className="bg-form-green text-white border-form-green font-medium text-xs px-3 py-1 rounded-[8px] font-dm-sans">
              Completo
            </Badge>
          )}
        </div>

        {/* Content section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-form-green font-dm-sans mb-2">{name}</h3>
            <p className="text-sm text-gray-600 font-dm-sans leading-relaxed">
              {completion ? `${completion.completedItems}/${completion.totalItems} elementi completati` : 'Clicca per visualizzare i dettagli'}
            </p>
          </div>

          {/* Progress bar */}
          {completion && (
            <div className="space-y-2">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-form-green transition-all duration-300 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-right font-dm-sans">
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
