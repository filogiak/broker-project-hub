
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
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
      className="cursor-pointer bg-white border border-[#BEB8AE] rounded-[12px] solid-shadow-light press-down-effect hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Top section with icon, title and status */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4 flex-1">
            <IconComponent className="h-6 w-6 text-form-green flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-black font-dm-sans">{name}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isComplete && (
              <Badge className="bg-lime-400 text-form-green border-lime-400 font-medium text-xs px-3 py-1 rounded-[8px] font-dm-sans">
                Incompleto {completionPercentage}%
              </Badge>
            )}
            
            {isComplete && (
              <Badge className="bg-form-green text-white border-form-green font-medium text-xs px-3 py-1 rounded-[8px] font-dm-sans">
                Completo
              </Badge>
            )}
            
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Content section */}
        <div className="space-y-4">
          <div>
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
