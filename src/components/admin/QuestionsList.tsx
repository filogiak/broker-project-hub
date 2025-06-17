import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Plus, Save, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { questionService } from '@/services/questionService';
import { useAutoSave } from '@/hooks/useAutoSave';
import CategoryFilter from './CategoryFilter';
import CategorySection from './CategorySection';
import DraggableQuestionRow from './DraggableQuestionRow';

interface QuestionsListProps {
  onCreateNew: () => void;
  onEdit: (question: any) => void;
  refreshTrigger: number;
}

interface PendingUpdate {
  id: string;
  priority: number;
  category_id?: string;
}

const QuestionsList = ({ onCreateNew, onEdit, refreshTrigger }: QuestionsListProps) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const saveQueuedChanges = async () => {
    if (pendingUpdates.length === 0) return;

    try {
      await questionService.batchUpdatePriorities(pendingUpdates);
      setPendingUpdates([]);
      console.log('Successfully saved', pendingUpdates.length, 'question priority updates');
    } catch (error) {
      console.error('Failed to save priority updates:', error);
      throw error;
    }
  };

  const { triggerSave, saveImmediately, isSaving, hasUnsavedChanges } = useAutoSave({
    delay: 3000,
    onSave: saveQueuedChanges,
    onError: (error) => {
      toast.error('Failed to auto-save question positions');
    }
  });

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [questionsData, categoriesData] = await Promise.all([
        questionService.getRequiredItems(),
        questionService.getItemsCategories()
      ]);
      
      setQuestions(questionsData);
      setCategories(categoriesData);
      
      // Auto-expand categories with questions when switching to 'all' view
      if (selectedCategory === 'all') {
        const categoriesWithQuestions = categoriesData.reduce((acc: Record<string, boolean>, category: any) => {
          const hasQuestions = questionsData.some((q: any) => q.category_id === category.id);
          acc[category.id] = hasQuestions;
          return acc;
        }, {});
        setExpandedCategories(categoriesWithQuestions);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load questions and categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteQuestionId) return;

    try {
      await questionService.deleteRequiredItem(deleteQuestionId);
      toast.success('Question deleted successfully');
      setDeleteQuestionId(null);
      loadData();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const addPendingUpdate = (update: PendingUpdate) => {
    setPendingUpdates(prev => {
      // Remove any existing update for this question
      const filtered = prev.filter(u => u.id !== update.id);
      return [...filtered, update];
    });
    triggerSave();
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'question') {
      setActiveQuestion(active.data.current.question);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveQuestion(null);

    if (!over) return;

    const activeId = active.id as string;
    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type !== 'question') return;

    const activeQuestion = activeData.question;

    // Handle dropping on a category
    if (overData?.type === 'category') {
      const newCategoryId = overData.categoryId;
      
      if (activeQuestion.category_id !== newCategoryId) {
        // Optimistically update local state
        setQuestions(prevQuestions => 
          prevQuestions.map(q => 
            q.id === activeId 
              ? { ...q, category_id: newCategoryId, priority: 1 }
              : q
          )
        );

        // Queue the update for background save
        addPendingUpdate({
          id: activeId,
          category_id: newCategoryId,
          priority: 1
        });

        toast.success('Question moved to new category');
      }
      return;
    }

    // Handle reordering within the same category
    if (overData?.type === 'question') {
      const overId = over.id as string;
      const overQuestion = overData.question;
      
      if (activeQuestion.category_id === overQuestion.category_id && activeId !== overId) {
        // Get current category questions and apply optimistic reordering
        const categoryQuestions = questions
          .filter(q => q.category_id === activeQuestion.category_id)
          .sort((a, b) => (a.priority || 0) - (b.priority || 0));
        
        const oldIndex = categoryQuestions.findIndex(q => q.id === activeId);
        const newIndex = categoryQuestions.findIndex(q => q.id === overId);
        
        const reorderedQuestions = arrayMove(categoryQuestions, oldIndex, newIndex);
        
        // Optimistically update local state
        setQuestions(prevQuestions => {
          const updatedQuestions = [...prevQuestions];
          
          reorderedQuestions.forEach((question, index) => {
            const questionIndex = updatedQuestions.findIndex(q => q.id === question.id);
            if (questionIndex !== -1) {
              updatedQuestions[questionIndex] = {
                ...updatedQuestions[questionIndex],
                priority: index + 1
              };
            }
          });
          
          return updatedQuestions;
        });

        // Queue all priority updates for background save
        const updates = reorderedQuestions.map((question, index) => ({
          id: question.id,
          priority: index + 1
        }));

        setPendingUpdates(prev => {
          // Remove any existing updates for these questions
          const filtered = prev.filter(u => !updates.some(update => update.id === u.id));
          return [...filtered, ...updates];
        });

        triggerSave();
        toast.success('Questions reordered');
      }
    }
  };

  // Filter and group questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(question =>
      question.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.answer_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.items_categories?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.subcategory_2?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.subcategory_3?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.subcategory_4?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.subcategory_5?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [questions, searchTerm]);

  const categorizedQuestions = useMemo(() => {
    const grouped = categories.reduce((acc: Record<string, any[]>, category) => {
      acc[category.id] = filteredQuestions.filter(q => q.category_id === category.id);
      return acc;
    }, {});
    
    // Add uncategorized questions
    grouped['uncategorized'] = filteredQuestions.filter(q => !q.category_id);
    
    return grouped;
  }, [categories, filteredQuestions]);

  const questionCounts = useMemo(() => {
    return categories.reduce((acc: Record<string, number>, category) => {
      acc[category.id] = categorizedQuestions[category.id]?.length || 0;
      return acc;
    }, {});
  }, [categories, categorizedQuestions]);

  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    
    if (categoryId === 'all') {
      // Expand all categories with questions
      const newExpanded = categories.reduce((acc: Record<string, boolean>, category) => {
        acc[category.id] = categorizedQuestions[category.id]?.length > 0;
        return acc;
      }, {});
      setExpandedCategories(newExpanded);
    } else {
      // Expand only the selected category
      setExpandedCategories({ [categoryId]: true });
    }
  };

  const displayedCategories = selectedCategory === 'all' 
    ? categories.filter(cat => categorizedQuestions[cat.id]?.length > 0)
    : categories.filter(cat => cat.id === selectedCategory);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading questions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Questions Management
              {(hasUnsavedChanges || isSaving) && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {isSaving ? (
                    <>
                      <Save className="h-3 w-3 animate-pulse" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" />
                      Unsaved changes
                    </>
                  )}
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Manage and organize questions by category. Drag questions to reorder or move between categories.
              {hasUnsavedChanges && (
                <span className="block text-orange-600 text-sm mt-1">
                  Changes will be saved automatically in a few seconds.
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {hasUnsavedChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={saveImmediately}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-1" />
                Save Now
              </Button>
            )}
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Question
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Category Filter */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            questionCounts={questionCounts}
          />

          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredQuestions.length} question(s) found
            </div>
          </div>

          {/* Questions by Category */}
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  {searchTerm ? 'No questions match your search.' : 'No questions created yet.'}
                </div>
                {!searchTerm && (
                  <Button onClick={onCreateNew} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Question
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {displayedCategories.map((category) => (
                  <CategorySection
                    key={category.id}
                    category={category}
                    questions={categorizedQuestions[category.id] || []}
                    isExpanded={expandedCategories[category.id] || false}
                    onToggleExpand={handleToggleCategory}
                    onEdit={onEdit}
                    onDelete={setDeleteQuestionId}
                  />
                ))}
                
                {/* Uncategorized Questions */}
                {categorizedQuestions['uncategorized']?.length > 0 && (
                  <CategorySection
                    category={{ id: 'uncategorized', name: 'Uncategorized' }}
                    questions={categorizedQuestions['uncategorized']}
                    isExpanded={expandedCategories['uncategorized'] || false}
                    onToggleExpand={handleToggleCategory}
                    onEdit={onEdit}
                    onDelete={setDeleteQuestionId}
                  />
                )}
              </div>
            )}

            <DragOverlay>
              {activeQuestion ? (
                <div className="bg-card border rounded-lg p-4 shadow-lg opacity-90">
                  <div className="font-medium">{activeQuestion.item_name}</div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteQuestionId} onOpenChange={() => setDeleteQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone and will also remove all associated options.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default QuestionsList;
