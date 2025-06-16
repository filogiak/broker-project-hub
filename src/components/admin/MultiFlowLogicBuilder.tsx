
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface LogicFlow {
  id: string;
  answerValue: string;
  targetSubcategory: string;
}

interface QuestionOption {
  option_value: string;
  option_label: string;
}

interface MultiFlowLogicBuilderProps {
  questionOptions: QuestionOption[];
  itemType: string;
  onLogicFlowsChange: (flows: LogicFlow[]) => void;
  initialFlows?: LogicFlow[];
  disabled?: boolean;
}

const MultiFlowLogicBuilder = ({
  questionOptions,
  itemType,
  onLogicFlowsChange,
  initialFlows = [],
  disabled = false
}: MultiFlowLogicBuilderProps) => {
  const [logicFlows, setLogicFlows] = useState<LogicFlow[]>(initialFlows);

  useEffect(() => {
    setLogicFlows(initialFlows);
  }, [initialFlows]);

  const addLogicFlow = () => {
    if (logicFlows.length >= 5) {
      toast.error('Maximum 5 logic flows allowed per question');
      return;
    }

    const newFlow: LogicFlow = {
      id: crypto.randomUUID(),
      answerValue: '',
      targetSubcategory: ''
    };

    const updatedFlows = [...logicFlows, newFlow];
    setLogicFlows(updatedFlows);
    onLogicFlowsChange(updatedFlows);
  };

  const removeLogicFlow = (flowId: string) => {
    const updatedFlows = logicFlows.filter(flow => flow.id !== flowId);
    setLogicFlows(updatedFlows);
    onLogicFlowsChange(updatedFlows);
  };

  const updateLogicFlow = (flowId: string, field: keyof LogicFlow, value: string) => {
    const updatedFlows = logicFlows.map(flow =>
      flow.id === flowId ? { ...flow, [field]: value } : flow
    );
    setLogicFlows(updatedFlows);
    onLogicFlowsChange(updatedFlows);
  };

  const getAvailableAnswerValues = () => {
    if (itemType === 'single_choice_dropdown' || itemType === 'multiple_choice_checkbox') {
      return questionOptions.map(opt => ({ value: opt.option_value, label: opt.option_label }));
    }
    
    // For other question types, provide common values
    return [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'true', label: 'True' },
      { value: 'false', label: 'False' }
    ];
  };

  const validateFlows = () => {
    const errors: string[] = [];
    const usedAnswerValues = new Set<string>();
    const usedSubcategories = new Set<string>();

    logicFlows.forEach((flow, index) => {
      if (!flow.answerValue.trim()) {
        errors.push(`Flow ${index + 1}: Answer value is required`);
      }
      if (!flow.targetSubcategory.trim()) {
        errors.push(`Flow ${index + 1}: Target subcategory is required`);
      }
      
      if (usedAnswerValues.has(flow.answerValue)) {
        errors.push(`Flow ${index + 1}: Answer value "${flow.answerValue}" is already used`);
      }
      usedAnswerValues.add(flow.answerValue);

      if (usedSubcategories.has(flow.targetSubcategory)) {
        errors.push(`Flow ${index + 1}: Subcategory "${flow.targetSubcategory}" is already used`);
      }
      usedSubcategories.add(flow.targetSubcategory);
    });

    return errors;
  };

  const availableAnswerValues = getAvailableAnswerValues();
  const validationErrors = validateFlows();

  if (!['single_choice_dropdown', 'multiple_choice_checkbox', 'text', 'number'].includes(itemType)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Multi-Flow Conditional Logic
          <Badge variant="outline">{logicFlows.length}/5 flows</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Configure different subcategory flows based on user answers. Each answer can trigger a different set of questions.
        </div>

        {logicFlows.map((flow, index) => (
          <div key={flow.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Flow {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeLogicFlow(flow.id)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`answer-${flow.id}`}>Answer Value</Label>
                {availableAnswerValues.length > 0 ? (
                  <Select
                    value={flow.answerValue}
                    onValueChange={(value) => updateLogicFlow(flow.id, 'answerValue', value)}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select answer value" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAnswerValues.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={`answer-${flow.id}`}
                    value={flow.answerValue}
                    onChange={(e) => updateLogicFlow(flow.id, 'answerValue', e.target.value)}
                    placeholder="Enter answer value"
                    disabled={disabled}
                  />
                )}
              </div>

              <div>
                <Label htmlFor={`subcategory-${flow.id}`}>Target Subcategory</Label>
                <Input
                  id={`subcategory-${flow.id}`}
                  value={flow.targetSubcategory}
                  onChange={(e) => updateLogicFlow(flow.id, 'targetSubcategory', e.target.value)}
                  placeholder="Enter subcategory name"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        ))}

        {validationErrors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="text-sm font-medium text-destructive mb-2">Validation Errors:</div>
            <ul className="text-sm text-destructive space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={addLogicFlow}
          disabled={disabled || logicFlows.length >= 5}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Logic Flow ({logicFlows.length}/5)
        </Button>

        {logicFlows.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-900 mb-2">How it works:</div>
            <div className="text-sm text-blue-800">
              When users answer this question, different subcategory questions will appear based on their selection:
            </div>
            <ul className="text-sm text-blue-800 mt-1 space-y-1">
              {logicFlows.map((flow, index) => (
                <li key={flow.id}>
                  • Answer "{flow.answerValue}" → Shows "{flow.targetSubcategory}" questions
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiFlowLogicBuilder;
