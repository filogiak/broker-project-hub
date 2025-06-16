
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, MoreHorizontal, Edit2, Trash2, Plus, Settings, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { questionService } from '@/services/questionService';

interface QuestionsListProps {
  onCreateNew: () => void;
  onEdit: (question: any) => void;
  refreshTrigger: number;
}

const QuestionsList = ({ onCreateNew, onEdit, refreshTrigger }: QuestionsListProps) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [logicRules, setLogicRules] = useState<Record<string, number>>({});

  useEffect(() => {
    loadQuestions();
  }, [refreshTrigger]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await questionService.getRequiredItems();
      setQuestions(data);
      
      // Load logic rules count for each question
      const logicRulesData: Record<string, number> = {};
      for (const question of data) {
        const rules = await questionService.getLogicRules(question.id);
        logicRulesData[question.id] = rules.length;
      }
      setLogicRules(logicRulesData);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load questions');
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
      loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const filteredQuestions = questions.filter(question =>
    question.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.answer_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.items_categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getItemTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Text',
      number: 'Number',
      date: 'Date',
      document: 'Document',
      repeatable_group: 'Repeatable Group',
      single_choice_dropdown: 'Dropdown',
      multiple_choice_checkbox: 'Checkbox'
    };
    return labels[type] || type;
  };

  const getScopeLabel = (scope: string) => {
    return scope === 'PROJECT' ? 'Project' : 'Participant';
  };

  const getQuestionTypeIndicators = (question: any) => {
    const indicators = [];
    
    // Traditional subcategory initiators
    if (question.subcategory_1_initiator) {
      indicators.push(
        <div key="sub1" className="flex items-center gap-1">
          <Settings className="h-3 w-3 text-blue-500" />
          <span className="text-xs text-blue-600">Sub1 Initiator</span>
        </div>
      );
    }
    
    if (question.subcategory_2_initiator) {
      indicators.push(
        <div key="sub2" className="flex items-center gap-1">
          <Settings className="h-3 w-3 text-green-500" />
          <span className="text-xs text-green-600">Sub2 Initiator</span>
        </div>
      );
    }
    
    // New multi-flow initiator
    if (question.is_multi_flow_initiator) {
      indicators.push(
        <div key="multi" className="flex items-center gap-1">
          <Layers className="h-3 w-3 text-purple-500" />
          <span className="text-xs text-purple-600">Multi-Flow</span>
        </div>
      );
    }
    
    return indicators;
  };

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
            <CardTitle>Questions Management</CardTitle>
            <CardDescription>
              Manage all questions in the required items database
            </CardDescription>
          </div>
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Question
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
              {filteredQuestions.length} question(s)
            </div>
          </div>

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
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Answer ID</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subcategory</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead>Logic Flows</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{question.item_name}</div>
                          <div className="flex flex-col gap-1 mt-1">
                            {getQuestionTypeIndicators(question)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {question.answer_id ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {question.answer_id}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {question.items_categories?.name || 'No Category'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {question.subcategory && (
                            <div>Main: {question.subcategory}</div>
                          )}
                          {question.subcategory_2 && (
                            <div>Sub2: {question.subcategory_2}</div>
                          )}
                          {!question.subcategory && !question.subcategory_2 && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {question.item_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {question.scope}
                        </Badge>
                      </TableCell>
                      <TableCell>{question.priority}</TableCell>
                      <TableCell>
                        {question.item_options?.length > 0 && (
                          <Badge variant="default">
                            {question.item_options.length} options
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {logicRules[question.id] > 0 ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {logicRules[question.id]} flow{logicRules[question.id] > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
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
                              onClick={() => setDeleteQuestionId(question.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteQuestionId} onOpenChange={() => setDeleteQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone and will also remove all associated options and logic flows.
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
