import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, AlertTriangle, Check, ChevronsUpDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTriggerItemDetails } from '@/hooks/useTriggerItemDetails';
import { cn } from '@/lib/utils';

interface LogicRule {
  id: string;
  trigger_item_id: string;
  trigger_value: string;
  target_subcategory: string;
  target_category_id?: string;
  is_active: boolean;
  trigger_item_name?: string;
  target_category_name?: string;
  trigger_item_exists?: boolean;
  target_category_exists?: boolean;
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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Form state for new rule
  const [newRule, setNewRule] = useState({
    trigger_item_id: '',
    trigger_value: '',
    target_subcategory: '',
    target_category_id: '',
  });

  // State for multiple trigger values (for single choice dropdowns)
  const [selectedTriggerValues, setSelectedTriggerValues] = useState<string[]>([]);

  // Get trigger item details and options
  const { itemDetails, options } = useTriggerItemDetails(newRule.trigger_item_id);

  useEffect(() => {
    fetchData();
  }, []);

  // Update trigger_value when selectedTriggerValues changes
  useEffect(() => {
    if (itemDetails?.hasOptions && selectedTriggerValues.length > 0) {
      const triggerValue = selectedTriggerValues.length === 1 
        ? selectedTriggerValues[0] 
        : JSON.stringify(selectedTriggerValues);
      
      setNewRule(prev => ({ ...prev, trigger_value: triggerValue }));
    }
  }, [selectedTriggerValues, itemDetails?.hasOptions]);

  // Reset selected trigger values when trigger item changes
  useEffect(() => {
    setSelectedTriggerValues([]);
    if (!itemDetails?.hasOptions) {
      setNewRule(prev => ({ ...prev, trigger_value: '' }));
    }
  }, [newRule.trigger_item_id, itemDetails?.hasOptions]);

  // Helper function to get selected trigger item name
  const getSelectedTriggerItemName = () => {
    const item = requiredItems.find(item => item.id === newRule.trigger_item_id);
    return item ? item.item_name : '';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      // Fetch logic rules with safer LEFT JOIN syntax
      const { data: rulesData, error: rulesError } = await supabase
        .from('question_logic_rules')
        .select(`
          *,
          trigger_item:required_items!fk_question_logic_rules_trigger_item (
            item_name
          ),
          target_category:items_categories!fk_question_logic_rules_target_category (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (rulesError) {
        console.error('Error fetching rules:', rulesError);
        throw rulesError;
      }

      // Fetch required items for dropdown
      const { data: itemsData, error: itemsError } = await supabase
        .from('required_items')
        .select('id, item_name, category_id')
        .order('item_name');

      if (itemsError) {
        console.error('Error fetching items:', itemsError);
        throw itemsError;
      }

      // Fetch categories for dropdown
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('items_categories')
        .select('id, name')
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        throw categoriesError;
      }

      // Fetch ALL subcategories from ALL 5 subcategory fields
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('required_items')
        .select('subcategory, subcategory_2, subcategory_3, subcategory_4, subcategory_5');

      if (subcategoriesError) {
        console.error('Error fetching subcategories:', subcategoriesError);
        throw subcategoriesError;
      }

      // Extract unique subcategories from all 5 fields and remove duplicates
      const allSubcategories = new Set<string>();
      
      subcategoriesData?.forEach(item => {
        // Add subcategory (subcategory_1)
        if (item.subcategory && item.subcategory.trim() !== '') {
          allSubcategories.add(item.subcategory);
        }
        // Add subcategory_2
        if (item.subcategory_2 && item.subcategory_2.trim() !== '') {
          allSubcategories.add(item.subcategory_2);
        }
        // Add subcategory_3
        if (item.subcategory_3 && item.subcategory_3.trim() !== '') {
          allSubcategories.add(item.subcategory_3);
        }
        // Add subcategory_4
        if (item.subcategory_4 && item.subcategory_4.trim() !== '') {
          allSubcategories.add(item.subcategory_4);
        }
        // Add subcategory_5
        if (item.subcategory_5 && item.subcategory_5.trim() !== '') {
          allSubcategories.add(item.subcategory_5);
        }
      });

      const uniqueSubcategories = Array.from(allSubcategories).sort();

      // Process rules data with defensive programming
      const processedRules = rulesData?.map(rule => {
        const triggerItem = rule.trigger_item as any;
        const targetCategory = rule.target_category as any;
        
        return {
          ...rule,
          trigger_item_name: triggerItem?.item_name || 'Unknown Question',
          target_category_name: targetCategory?.name || null,
          trigger_item_exists: !!triggerItem?.item_name,
          target_category_exists: rule.target_category_id ? !!targetCategory?.name : true,
        };
      }) || [];
      
      setRules(processedRules);
      setRequiredItems(itemsData || []);
      setCategories(categoriesData || []);
      setSubcategories(uniqueSubcategories);
    } catch (error) {
      console.error('Error fetching logic rules data:', error);
      setFetchError('Failed to load logic rules data. Please try again.');
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
      setSelectedTriggerValues([]);

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

  const handleTriggerValueChange = (optionValue: string, checked: boolean) => {
    setSelectedTriggerValues(prev => {
      if (checked) {
        return [...prev, optionValue];
      } else {
        return prev.filter(val => val !== optionValue);
      }
    });
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

  // Helper function to display trigger values in rules list
  const formatTriggerValue = (triggerValue: string) => {
    try {
      const parsed = JSON.parse(triggerValue);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      }
    } catch {
      // Not JSON, return as is
    }
    return triggerValue;
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading logic rules...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {fetchError}
            <Button 
              onClick={fetchData} 
              variant="outline" 
              size="sm" 
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
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
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {newRule.trigger_item_id
                      ? getSelectedTriggerItemName()
                      : "Select trigger question..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search questions..." />
                    <CommandList>
                      <CommandEmpty>No questions found.</CommandEmpty>
                      <CommandGroup>
                        {requiredItems.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={item.item_name}
                            onSelect={() => {
                              setNewRule(prev => ({ ...prev, trigger_item_id: item.id }));
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                newRule.trigger_item_id === item.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {item.item_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger-value">Trigger Value</Label>
              {itemDetails?.hasOptions ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Select one or more options that should trigger this rule:
                  </p>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                    {options.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No options available</p>
                    ) : (
                      options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`trigger-${option.id}`}
                            checked={selectedTriggerValues.includes(option.value)}
                            onCheckedChange={(checked) => 
                              handleTriggerValueChange(option.value, checked as boolean)
                            }
                          />
                          <Label htmlFor={`trigger-${option.id}`} className="text-sm">
                            {option.label}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <Input
                  id="trigger-value"
                  value={newRule.trigger_value}
                  onChange={(e) => setNewRule(prev => ({ ...prev, trigger_value: e.target.value }))}
                  placeholder="Answer that triggers logic"
                />
              )}
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
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No subcategories available. Create questions with subcategories first.
                    </div>
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
                  {categories.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No categories available
                    </div>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
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
                  className={`p-4 border rounded-lg ${
                    rule.is_active ? 'bg-background' : 'bg-muted/50'
                  } ${
                    !rule.trigger_item_exists || !rule.target_category_exists 
                      ? 'border-destructive/50 bg-destructive/5' 
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="font-medium">
                        {rule.trigger_item_name}
                        {!rule.trigger_item_exists && (
                          <span className="ml-2 text-sm text-destructive font-normal">
                            (Question Deleted)
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        When answer = "{formatTriggerValue(rule.trigger_value)}" → Show subcategory "{rule.target_subcategory}"
                        {rule.target_category_name && rule.target_category_exists && (
                          <span> in category "{rule.target_category_name}"</span>
                        )}
                        {rule.target_category_id && !rule.target_category_exists && (
                          <span className="text-destructive"> in category (Category Deleted)</span>
                        )}
                      </div>
                      {(!rule.trigger_item_exists || !rule.target_category_exists) && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            This rule references deleted items and may not work correctly. Consider deleting this rule.
                          </AlertDescription>
                        </Alert>
                      )}
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
