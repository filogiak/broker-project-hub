
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
  
  // Helper function to check if a question is a main question
  const isMainQuestion = (question: Question) => {
    // A question is a main question if:
    // 1. It has no subcategories at all, OR
    // 2. It has any subcategory with the corresponding initiator flag enabled
    
    const hasNoSubcategories = !question.subcategory && 
                              !question.subcategory_2 && 
                              !question.subcategory_3 && 
                              !question.subcategory_4 && 
                              !question.subcategory_5;
    
    if (hasNoSubcategories) return true;
    
    // Check if any subcategory has its initiator flag enabled
    const hasInitiatorFlag = question.subcategory_1_initiator || 
                             question.subcategory_2_initiator || 
                             question.subcategory_3_initiator || 
                             question.subcategory_4_initiator || 
                             question.subcategory_5_initiator;
    
    return hasInitiatorFlag;
  };

  // Helper function to get all subcategories for a question (for non-main questions)
  const getQuestionSubcategories = (question: Question): string[] => {
    const subcategories: string[] = [];
    
    if (question.subcategory && !question.subcategory_1_initiator) {
      subcategories.push(question.subcategory);
    }
    if (question.subcategory_2 && !question.subcategory_2_initiator) {
      subcategories.push(question.subcategory_2);
    }
    if (question.subcategory_3 && !question.subcategory_3_initiator) {
      subcategories.push(question.subcategory_3);
    }
    if (question.subcategory_4 && !question.subcategory_4_initiator) {
      subcategories.push(question.subcategory_4);
    }
    if (question.subcategory_5 && !question.subcategory_5_initiator) {
      subcategories.push(question.subcategory_5);
    }
    
    return subcategories;
  };

  // Separate questions into main questions and subcategory groups
  const mainQuestions = sortedQuestions.filter(isMainQuestion);
  const nonMainQuestions = sortedQuestions.filter(q => !isMainQuestion(q));
  
  // Group non-main questions by subcategory
  const subcategoryGroups: Record<string, Question[]> = {};
  
  nonMainQuestions.forEach(question => {
    const subcategories = getQuestionSubcategories(question);
    
    // For questions with multiple subcategories, add them to each subcategory group
    subcategories.forEach(subcategory => {
      if (!subcategoryGroups[subcategory]) {
        subcategoryGroups[subcategory] = [];
      }
      subcategoryGroups[subcategory].push(question);
    });
  });

  // Remove duplicates in subcategory groups (in case a question appears in multiple subcategories)
  Object.keys(subcategoryGroups).forEach(subcategory => {
    const uniqueQuestions = subcategoryGroups[subcategory].filter((question, index, arr) => 
      arr.findIndex(q => q.id === question.id) === index
    );
    subcategoryGroups[subcategory] = uniqueQuestions;
  });

  const mainQuestionIds = mainQuestions.map(q => q.id);

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
            <div className="space-y-6">
              {/* Main Questions Section */}
              {mainQuestions.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-3 px-2">
                    Main Questions ({mainQuestions.length})
                  </div>
                  <SortableContext items={mainQuestionIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {mainQuestions.map((question) => (
                        <DraggableQuestionRow
                          key={question.id}
                          question={question}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )}

              {/* Subcategory Sections */}
              {Object.entries(subcategoryGroups).map(([subcategoryName, subcategoryQuestions]) => {
                const subcategoryQuestionIds = subcategoryQuestions.map(q => q.id);
                
                return (
                  <div key={subcategoryName}>
                    <div className="text-sm font-medium text-muted-foreground mb-3 px-2">
                      {subcategoryName} ({subcategoryQuestions.length})
                    </div>
                    <SortableContext items={subcategoryQuestionIds} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {subcategoryQuestions.map((question) => (
                          <DraggableQuestionRow
                            key={question.id}
                            question={question}
                            onEdit={onEdit}
                            onDelete={onDelete}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default CategorySection;
