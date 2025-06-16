import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { questionService } from '@/services/questionService';
import QuestionOptionManager from './QuestionOptionManager';
import LogicRulesManager from './LogicRulesManager';
import type { Database } from '@/integrations/supabase/types';

type RequiredItem = Database['public']['Tables']['required_items']['Row'];
type RequiredItemInsert = Database['public']['Tables']['required_items']['Insert'];
type RequiredItemUpdate = Database['public']['Tables']['required_items']['Update'];
type ItemsCategory = Database['public']['Tables']['items_categories']['Row'];
type ItemType = Database['public']['Enums']['item_type'];
type ItemScope = Database['public']['Enums']['item_scope'];
type ProjectType = Database['public']['Enums']['project_type'];

const QuestionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ItemsCategory[]>([]);
  const [formData, setFormData] = useState<Partial<RequiredItem>>({
    item_name: '',
    item_type: 'text' as ItemType,
    scope: 'PROJECT' as ItemScope,
    category_id: '',
    subcategory: '',
    subcategory_2: '',
    subcategory_3: '',
    subcategory_4: '',
    subcategory_5: '',
    subcategory_1_initiator: false,
    subcategory_2_initiator: false,
    subcategory_3_initiator: false,
    subcategory_4_initiator: false,
    subcategory_5_initiator: false,
    priority: 0,
    project_types_applicable: [],
    validation_rules: {},
  });

  const projectTypes: ProjectType[] = [
    'first_home_purchase',
    'refinance',
    'investment_property',
    'construction_loan',
    'home_equity_loan',
    'reverse_mortgage'
  ];

  useEffect(() => {
    loadCategories();
    if (isEditing && id) {
      loadQuestion(id);
    }
  }, [isEditing, id]);

  const loadCategories = async () => {
    try {
      const data = await questionService.getItemsCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    }
  };

  const loadQuestion = async (questionId: string) => {
    try {
      setLoading(true);
      const question = await questionService.getRequiredItemById(questionId);
      if (question) {
        setFormData(question);
      } else {
        toast({
          title: "Error",
          description: "Question not found",
          variant: "destructive",
        });
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error loading question:', error);
      toast({
        title: "Error",
        description: "Failed to load question",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.item_name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Question name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      if (isEditing && id) {
        const updates: RequiredItemUpdate = { ...formData };
        await questionService.updateRequiredItem(id, updates);
        toast({
          title: "Success",
          description: "Question updated successfully",
        });
      } else {
        const newItem: RequiredItemInsert = { ...formData } as RequiredItemInsert;
        await questionService.createRequiredItem(newItem);
        toast({
          title: "Success",
          description: "Question created successfully",
        });
      }

      navigate('/admin');
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectTypeToggle = (projectType: ProjectType, checked: boolean) => {
    const currentTypes = formData.project_types_applicable || [];
    let newTypes: ProjectType[];
    
    if (checked) {
      newTypes = [...currentTypes, projectType];
    } else {
      newTypes = currentTypes.filter(type => type !== projectType);
    }
    
    setFormData(prev => ({
      ...prev,
      project_types_applicable: newTypes
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Question' : 'Create New Question'}
        </h1>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories (5-Slot)</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
          <TabsTrigger value="logic">Logic Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Configure the core properties of this question
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="item_name">Question Name *</Label>
                  <Input
                    id="item_name"
                    value={formData.item_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                    placeholder="Enter question name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="item_type">Question Type</Label>
                    <Select
                      value={formData.item_type || 'text'}
                      onValueChange={(value: ItemType) => setFormData(prev => ({ ...prev, item_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="single_choice_dropdown">Single Choice Dropdown</SelectItem>
                        <SelectItem value="multiple_choice_checkbox">Multiple Choice Checkbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="scope">Scope</Label>
                    <Select
                      value={formData.scope || 'PROJECT'}
                      onValueChange={(value: ItemScope) => setFormData(prev => ({ ...prev, scope: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select scope" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PROJECT">Project</SelectItem>
                        <SelectItem value="PARTICIPANT">Participant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category_id">Category</Label>
                    <Select
                      value={formData.category_id || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={formData.priority || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Applicable Project Types</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select which project types this question applies to (leave all unchecked for all types)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {projectTypes.map((projectType) => (
                      <div key={projectType} className="flex items-center space-x-2">
                        <Checkbox
                          id={`project-type-${projectType}`}
                          checked={formData.project_types_applicable?.includes(projectType) || false}
                          onCheckedChange={(checked) => handleProjectTypeToggle(projectType, !!checked)}
                        />
                        <Label htmlFor={`project-type-${projectType}`} className="capitalize">
                          {projectType.replace(/_/g, ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Question'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="subcategories">
          <Card>
            <CardHeader>
              <CardTitle>5-Slot Subcategory System</CardTitle>
              <CardDescription>
                Configure up to 5 subcategories and their initiator settings. Each question can belong to multiple subcategories and can initiate conditional logic for any of them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subcategory Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5].map((num) => {
                  const subcategoryKey = num === 1 ? 'subcategory' : `subcategory_${num}` as keyof typeof formData;
                  const initiatorKey = `subcategory_${num}_initiator` as keyof typeof formData;
                  
                  return (
                    <div key={num} className="p-4 border rounded-lg space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">
                        Subcategory {num}
                      </h4>
                      
                      <div>
                        <Label htmlFor={`subcategory-${num}`} className="text-sm">
                          Subcategory Name
                        </Label>
                        <Input
                          id={`subcategory-${num}`}
                          value={(formData[subcategoryKey] as string) || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            [subcategoryKey]: e.target.value 
                          }))}
                          placeholder={`Enter subcategory ${num} name`}
                          className="text-sm"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`initiator-${num}`}
                          checked={(formData[initiatorKey] as boolean) || false}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            [initiatorKey]: !!checked 
                          }))}
                        />
                        <Label htmlFor={`initiator-${num}`} className="text-sm">
                          Is Initiator
                        </Label>
                      </div>
                      
                      {(formData[initiatorKey] as boolean) && (formData[subcategoryKey] as string) && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          ✓ This question will trigger conditional logic for "{formData[subcategoryKey]}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Current Configuration Summary:</h4>
                <div className="text-sm space-y-1">
                  {(() => {
                    const subcategories = [
                      formData.subcategory,
                      formData.subcategory_2,
                      formData.subcategory_3,
                      formData.subcategory_4,
                      formData.subcategory_5
                    ].filter(Boolean);
                    
                    const initiators = [];
                    if (formData.subcategory_1_initiator && formData.subcategory) initiators.push(`1:"${formData.subcategory}"`);
                    if (formData.subcategory_2_initiator && formData.subcategory_2) initiators.push(`2:"${formData.subcategory_2}"`);
                    if (formData.subcategory_3_initiator && formData.subcategory_3) initiators.push(`3:"${formData.subcategory_3}"`);
                    if (formData.subcategory_4_initiator && formData.subcategory_4) initiators.push(`4:"${formData.subcategory_4}"`);
                    if (formData.subcategory_5_initiator && formData.subcategory_5) initiators.push(`5:"${formData.subcategory_5}"`);
                    
                    return (
                      <>
                        <div>• <strong>Subcategories:</strong> {subcategories.length ? subcategories.join(', ') : 'None (Main question)'}</div>
                        <div>• <strong>Initiates logic for:</strong> {initiators.length ? initiators.join(', ') : 'None'}</div>
                        <div>• <strong>Question type:</strong> {subcategories.length === 0 ? 'Main question' : initiators.length > 0 ? 'Initiator question' : 'Conditional question'}</div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)} 
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Subcategory Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="options">
          {isEditing && id ? (
            <QuestionOptionManager requiredItemId={id} />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Save the question first to manage options
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logic">
          {isEditing && id ? (
            <LogicRulesManager itemId={id} />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Save the question first to configure logic rules
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuestionForm;
