
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { questionService } from '@/services/questionService';
import type { Database } from '@/integrations/supabase/types';

type RequiredItem = Database['public']['Tables']['required_items']['Row'];
type ItemsCategory = Database['public']['Tables']['items_categories']['Row'];

const QuestionsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [questions, setQuestions] = useState<RequiredItem[]>([]);
  const [categories, setCategories] = useState<ItemsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [questionsData, categoriesData] = await Promise.all([
        questionService.getRequiredItems(),
        questionService.getItemsCategories()
      ]);
      setQuestions(questionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId: string, questionName: string) => {
    if (!confirm(`Are you sure you want to delete "${questionName}"?`)) {
      return;
    }

    try {
      await questionService.deleteRequiredItem(questionId);
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      loadData();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  const getQuestionTypeInfo = (question: RequiredItem) => {
    // UPDATED: Check all 5 subcategory fields and initiator flags
    const subcategories = [
      question.subcategory,
      question.subcategory_2,
      question.subcategory_3,
      question.subcategory_4,
      question.subcategory_5
    ].filter(Boolean);

    const initiatorFlags = [
      question.subcategory_1_initiator,
      question.subcategory_2_initiator,
      question.subcategory_3_initiator,
      question.subcategory_4_initiator,
      question.subcategory_5_initiator
    ];

    const initiatorSubcategories = [];
    if (question.subcategory_1_initiator && question.subcategory) {
      initiatorSubcategories.push(`1:"${question.subcategory}"`);
    }
    if (question.subcategory_2_initiator && question.subcategory_2) {
      initiatorSubcategories.push(`2:"${question.subcategory_2}"`);
    }
    if (question.subcategory_3_initiator && question.subcategory_3) {
      initiatorSubcategories.push(`3:"${question.subcategory_3}"`);
    }
    if (question.subcategory_4_initiator && question.subcategory_4) {
      initiatorSubcategories.push(`4:"${question.subcategory_4}"`);
    }
    if (question.subcategory_5_initiator && question.subcategory_5) {
      initiatorSubcategories.push(`5:"${question.subcategory_5}"`);
    }

    const isMainQuestion = subcategories.length === 0;
    const hasAnyInitiator = initiatorFlags.some(flag => flag === true);
    const isConditionalQuestion = subcategories.length > 0 && !hasAnyInitiator;

    if (isMainQuestion) {
      return {
        type: 'main',
        label: 'Main Question',
        color: 'bg-green-100 text-green-800',
        description: 'Always included in form generation'
      };
    } else if (hasAnyInitiator) {
      return {
        type: 'initiator',
        label: 'Initiator Question',
        color: 'bg-blue-100 text-blue-800',
        description: `Initiates logic for: ${initiatorSubcategories.join(', ')}`
      };
    } else if (isConditionalQuestion) {
      return {
        type: 'conditional',
        label: 'Conditional Question',
        color: 'bg-orange-100 text-orange-800',
        description: `Belongs to: ${subcategories.join(', ')}`
      };
    }

    return {
      type: 'unknown',
      label: 'Unknown',
      color: 'bg-gray-100 text-gray-800',
      description: 'Question type unclear'
    };
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || question.category_id === selectedCategory;
    
    let matchesType = true;
    if (selectedType !== 'all') {
      const typeInfo = getQuestionTypeInfo(question);
      matchesType = typeInfo.type === selectedType;
    }
    
    return matchesSearch && matchesCategory && matchesType;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Questions Management</h1>
          <p className="text-muted-foreground">
            Manage questions with 5-slot subcategory support
          </p>
        </div>
        <Button onClick={() => navigate('/admin/questions/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Question
        </Button>
      </div>

      {/* Enhanced Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Question Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="main">Main Questions</SelectItem>
                  <SelectItem value="initiator">Initiator Questions</SelectItem>
                  <SelectItem value="conditional">Conditional Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedType('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="grid gap-4">
        {filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== 'all' || selectedType !== 'all'
                  ? 'No questions match your filters'
                  : 'No questions created yet'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredQuestions.map((question) => {
            const typeInfo = getQuestionTypeInfo(question);
            const categoryName = categories.find(c => c.id === question.category_id)?.name || 'Uncategorized';
            
            return (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{question.item_name}</h3>
                        <Badge className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                        <Badge variant="outline">
                          {question.item_type}
                        </Badge>
                        <Badge variant="outline">
                          {question.scope}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p><strong>Category:</strong> {categoryName}</p>
                        <p><strong>Priority:</strong> {question.priority || 0}</p>
                        <p><strong>Type Info:</strong> {typeInfo.description}</p>
                        
                        {question.project_types_applicable && question.project_types_applicable.length > 0 && (
                          <p>
                            <strong>Project Types:</strong> {question.project_types_applicable.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/questions/${question.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(question.id, question.item_name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {filteredQuestions.filter(q => getQuestionTypeInfo(q).type === 'main').length}
              </div>
              <div className="text-sm text-muted-foreground">Main Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {filteredQuestions.filter(q => getQuestionTypeInfo(q).type === 'initiator').length}
              </div>
              <div className="text-sm text-muted-foreground">Initiator Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {filteredQuestions.filter(q => getQuestionTypeInfo(q).type === 'conditional').length}
              </div>
              <div className="text-sm text-muted-foreground">Conditional Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {filteredQuestions.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Filtered</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionsList;
