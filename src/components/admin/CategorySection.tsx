
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DraggableQuestionRow from './DraggableQuestionRow';

interface Category {
  id: string;
  name: string;
}

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

interface CategorySectionProps {
  category: Category;
  questions: Question[];
  isExpanded: boolean;
  onToggleExpand: (categoryId: string) => void;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
  isDragOver?: boolean;
}

const CategorySection = ({ 
  category, 
  questions, 
  isExpanded, 
  onToggleExpand, 
  onEdit, 
  onDelete,
  isDragOver = false 
}: CategorySectionProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `category-${category.id}`,
    data: {
      type: 'category',
      categoryId: category.id,
    },
  });

  const sortedQuestions = [...questions].sort((a, b) => (a.priority || 0) - (b.priority || 0));
  const questionIds = sortedQuestions.map(q => q.id);

  return (
    <Card 
      ref={setNodeRef}
      className={`transition-all duration-200 ${
        isOver ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpand(category.id)}
              className="p-1 h-auto"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <CardTitle className="text-lg">{category.name}</CardTitle>
            <span className="text-sm text-muted-foreground">
              ({questions.length} question{questions.length !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <div className="text-sm">No questions in this category</div>
              <div className="text-xs mt-1">Drag questions here to organize them</div>
            </div>
          ) : (
            <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {sortedQuestions.map((question) => (
                  <DraggableQuestionRow
                    key={question.id}
                    question={question}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default CategorySection;
