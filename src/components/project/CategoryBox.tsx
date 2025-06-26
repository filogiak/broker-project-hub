
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
        {/* Top section with icon and badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center">
            <IconComponent className="h-9 w-9 text-form-green" />
          </div>
          
          {!isComplete && (
            <Badge 
              className="font-medium text-xs px-3 py-1 rounded-[8px] font-dm-sans border-[#E3FD53] text-form-green"
              style={{ backgroundColor: '#E3FD53' }}
            >
              Completato al {completionPercentage}%
            </Badge>
          )}
          
          {isComplete && (
            <Badge className="bg-form-green text-white border-form-green font-medium text-xs px-3 py-1 rounded-[8px] font-dm-sans">
              Completo
            </Badge>
          )}
        </div>

        {/* Content section */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-black font-dm-sans mb-2 text-xl">{name}</h3>
            <p className="text-sm text-gray-600 font-dm-sans leading-relaxed">
              {completion ? `${completion.completedItems}/${completion.totalItems} elementi completati` : 'Clicca per visualizzare i dettagli'}
            </p>
          </div>

          {/* Progress bar */}
          {completion && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-form-green transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Bottom section with count and arrow */}
          {completion && (
            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
              <span className="font-semibold text-form-green">{completion.totalItems}</span>
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </div>
          )}

          {/* Arrow only section for categories without completion data */}
          {!completion && (
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryBox;
