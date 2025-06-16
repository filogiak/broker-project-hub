import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LogicRule {
  id: string;
  trigger_item_id: string;
  trigger_value: string;
  target_subcategory: string;
  target_category_id?: string;
  is_active: boolean;
  trigger_item_name?: string;
  target_category_name?: string;
}

interface RequiredItem {
  id: string;
  item_name: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
}

const LogicRulesManager = () => {
  const [rules, setRules] = useState<LogicRule[]>([]);
  const [requiredItems, setRequiredItems] = useState<RequiredItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  // Form state for new rule
  const [newRule, setNewRule] = useState({
    trigger_item_id: '',
    trigger_value: '',
    target_subcategory: '',
    target_category_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch logic rules with related data
      const { data: rulesData, error: rulesError } = await supabase
        .from('question_logic_rules')
        .select(`
          *,
          required_items!trigger_item_id (item_name),
          items_categories!target_category_id (name)
        `)
        .order('created_at', { ascending: false });

      if (rulesError) throw rulesError;

      // Fetch required items for dropdown
      const { data: itemsData, error: itemsError } = await supabase
        .from('required_items')
        .select('id, item_name, category_id')
        .order('item_name');

      if (itemsError) throw itemsError;

      // Fetch categories for dropdown
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('items_categories')
        .select('id, name')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch unique subcategories
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('required_items')
        .select('subcategory')
        .not('subcategory', 'is', null)
        .neq('subcategory', '');

      if (subcategoriesError) throw subcategoriesError;

      // Extract unique subcategories and remove duplicates
      const uniqueSubcategories = [...new Set(
        subcategoriesData
          ?.map(item => item.subcategory)
          .filter(subcategory => subcategory && subcategory.trim() !== '') || []
      )].sort();

      setRules(rulesData?.map(rule => ({
        ...rule,
        trigger_item_name: (rule.required_items as any)?.item_name,
        target_category_name: (rule.items_categories as any)?.name,
      })) || []);
      
      setRequiredItems(itemsData || []);
      setCategories(categoriesData || []);
      setSubcategories(uniqueSubcategories);
    } catch (error) {
      console.error('Error fetching logic rules data:', error);
      toast({
        title: "Error",
        description: "Failed to load logic rules data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.trigger_item_id || !newRule.trigger_value || !newRule.target_subcategory) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);

      const { error } = await supabase
        .from('question_logic_rules')
        .insert({
          trigger_item_id: newRule.trigger_item_id,
          trigger_value: newRule.trigger_value,
          target_subcategory: newRule.target_subcategory,
          target_category_id: newRule.target_category_id || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Logic rule created successfully",
      });

      setNewRule({
        trigger_item_id: '',
        trigger_value: '',
        target_subcategory: '',
        target_category_id: '',
      });

      await fetchData();
    } catch (error) {
      console.error('Error creating logic rule:', error);
      toast({
        title: "Error",
        description: "Failed to create logic rule",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('question_logic_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Logic rule deleted successfully",
      });

      await fetchData();
    } catch (error) {
      console.error('Error deleting logic rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete logic rule",
        variant: "destructive",
      });
    }
  };

  const toggleRuleActive = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('question_logic_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Logic rule ${!isActive ? 'activated' : 'deactivated'}`,
      });

      await fetchData();
    } catch (error) {
      console.error('Error updating logic rule:', error);
      toast({
        title: "Error",
        description: "Failed to update logic rule",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading logic rules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Logic Rules Manager</h2>
        <p className="text-muted-foreground">
          Create and manage conditional logic rules for dynamic form questions
        </p>
      </div>

      {/* Create New Rule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Logic Rule
          </CardTitle>
          <CardDescription>
            Define when additional questions should appear based on user answers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trigger-item">Trigger Question</Label>
              <Select
                value={newRule.trigger_item_id}
                onValueChange={(value) => setNewRule(prev => ({ ...prev, trigger_item_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger question" />
                </SelectTrigger>
                <SelectContent>
                  {requiredItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.item_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger-value">Trigger Value</Label>
              <Input
                id="trigger-value"
                value={newRule.trigger_value}
                onChange={(e) => setNewRule(prev => ({ ...prev, trigger_value: e.target.value }))}
                placeholder="Answer that triggers logic"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-subcategory">Target Subcategory</Label>
              <Select
                value={newRule.target_subcategory}
                onValueChange={(value) => setNewRule(prev => ({ ...prev, target_subcategory: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.length === 0 ? (
                    <SelectItem value="" disabled>
                      No subcategories available
                    </SelectItem>
                  ) : (
                    subcategories.map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-category">Target Category (Optional)</Label>
              <Select
                value={newRule.target_category_id}
                onValueChange={(value) => setNewRule(prev => ({ ...prev, target_category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Same category" />
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
          </div>

          <Button onClick={handleCreateRule} disabled={creating} className="w-full">
            {creating ? 'Creating...' : 'Create Rule'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Logic Rules</CardTitle>
          <CardDescription>
            Manage your conditional logic rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No logic rules created yet
            </p>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 border rounded-lg ${rule.is_active ? 'bg-background' : 'bg-muted/50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="font-medium">
                        {rule.trigger_item_name || 'Unknown Question'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        When answer = "{rule.trigger_value}" → Show subcategory "{rule.target_subcategory}"
                        {rule.target_category_name && (
                          <span> in category "{rule.target_category_name}"</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rule.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRuleActive(rule.id, rule.is_active)}
                      >
                        {rule.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogicRulesManager;
