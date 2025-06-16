
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit2, Trash2, GripVertical } from 'lucide-react';
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

  // Helper functions
  const getInitiatorInfo = (question: Question) => {
    const initiators = [];
    if (question.subcategory_1_initiator && question.subcategory) {
      initiators.push(question.subcategory);
    }
    if (question.subcategory_2_initiator && question.subcategory_2) {
      initiators.push(question.subcategory_2);
    }
    if (question.subcategory_3_initiator && question.subcategory_3) {
      initiators.push(question.subcategory_3);
    }
    if (question.subcategory_4_initiator && question.subcategory_4) {
      initiators.push(question.subcategory_4);
    }
    if (question.subcategory_5_initiator && question.subcategory_5) {
      initiators.push(question.subcategory_5);
    }
    return initiators;
  };

  const getSubcategoriesDisplay = (question: Question) => {
    const subcategories = [];
    if (question.subcategory) subcategories.push(question.subcategory);
    if (question.subcategory_2) subcategories.push(question.subcategory_2);
    if (question.subcategory_3) subcategories.push(question.subcategory_3);
    if (question.subcategory_4) subcategories.push(question.subcategory_4);
    if (question.subcategory_5) subcategories.push(question.subcategory_5);
    return subcategories;
  };

  const initiators = getInitiatorInfo(question);
  const subcategories = getSubcategoriesDisplay(question);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border rounded-lg p-4 transition-all duration-200 ${
        isDragging ? 'opacity-50 shadow-lg scale-105 z-50' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Question Name */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{question.item_name}</div>
        </div>

        {/* Answer ID */}
        <div className="flex-shrink-0">
          {question.answer_id ? (
            <Badge variant="outline" className="font-mono text-xs">
              {question.answer_id}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </div>

        {/* Type */}
        <div className="flex-shrink-0">
          <Badge variant="secondary">
            {question.item_type}
          </Badge>
        </div>

        {/* Subcategories */}
        <div className="flex-shrink-0 min-w-0 max-w-40">
          {subcategories.length > 0 ? (
            <div className="space-y-1">
              {subcategories.slice(0, 2).map((sub, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {sub}
                </Badge>
              ))}
              {subcategories.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{subcategories.length - 2} more
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </div>

        {/* Initiators */}
        <div className="flex-shrink-0">
          {initiators.length > 0 ? (
            <Badge variant="default" className="text-xs">
              {initiators.length} initiator{initiators.length > 1 ? 's' : ''}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(question)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(question.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default DraggableQuestionRow;
