import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, GripVertical, Star } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Question {
  id: string;
  item_name: string;
  answer_id?: string;
  items_categories?: { name: string };
  item_type: string;
  scope: string;
  priority: number;
  subcategory?: string;
  subcategory_2?: string;
  subcategory_3?: string;
  subcategory_4?: string;
  subcategory_5?: string;
  subcategory_1_initiator?: boolean;
  subcategory_2_initiator?: boolean;
  subcategory_3_initiator?: boolean;
  subcategory_4_initiator?: boolean;
  subcategory_5_initiator?: boolean;
  item_options?: any[];
}

interface DraggableQuestionRowProps {
  question: Question;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

const DraggableQuestionRow = ({ question, onEdit, onDelete }: DraggableQuestionRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
    data: {
      type: 'question',
      question,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Helper function to get all subcategories with their initiator status
  const getSubcategories = () => {
    const subcategories = [];
    
    if (question.subcategory) {
      subcategories.push({
        name: question.subcategory,
        isInitiator: question.subcategory_1_initiator
      });
    }
    if (question.subcategory_2) {
      subcategories.push({
        name: question.subcategory_2,
        isInitiator: question.subcategory_2_initiator
      });
    }
    if (question.subcategory_3) {
      subcategories.push({
        name: question.subcategory_3,
        isInitiator: question.subcategory_3_initiator
      });
    }
    if (question.subcategory_4) {
      subcategories.push({
        name: question.subcategory_4,
        isInitiator: question.subcategory_4_initiator
      });
    }
    if (question.subcategory_5) {
      subcategories.push({
        name: question.subcategory_5,
        isInitiator: question.subcategory_5_initiator
      });
    }
    
    return subcategories;
  };

  const subcategories = getSubcategories();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border rounded-lg p-4 transition-all duration-200 ${
        isDragging ? 'opacity-50 shadow-lg scale-105 z-50' : 'hover:shadow-md'
      }`}
    >
      <div className="grid grid-cols-12 gap-4 items-center w-full">
        {/* Column 1: Drag Handle (1 col) */}
        <div className="col-span-1 flex justify-center">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Column 2: Question Name (4 cols) */}
        <div className="col-span-4 min-w-0">
          <div className="font-medium truncate">{question.item_name}</div>
        </div>

        {/* Column 3: Scope (1 col) */}
        <div className="col-span-1 flex justify-center">
          <Badge 
            variant={question.scope === 'PROJECT' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {question.scope}
          </Badge>
        </div>

        {/* Column 4: Subcategories (3 cols) */}
        <div className="col-span-3 flex flex-wrap gap-1">
          {subcategories.map((subcategory, index) => (
            <Badge
              key={index}
              variant="outline"
              className={`text-xs flex items-center gap-1 ${
                subcategory.isInitiator ? 'border-orange-500 text-orange-700 bg-orange-50' : ''
              }`}
            >
              {subcategory.isInitiator && (
                <Star className="h-3 w-3 fill-current" />
              )}
              {subcategory.name}
            </Badge>
          ))}
        </div>

        {/* Column 5: Answer ID (1 col) */}
        <div className="col-span-1 flex justify-center">
          {question.answer_id ? (
            <Badge variant="outline" className="font-mono text-xs">
              {question.answer_id}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </div>
        
        {/* Column 6: Action buttons (2 cols) */}
        <div className="col-span-2 flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(question)}
            className="h-8 w-8 p-0"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(question.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DraggableQuestionRow;
