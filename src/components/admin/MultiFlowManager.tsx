
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

export interface AdditionalFlow {
  id: string;
  answerValue: string;
  targetSubcategory: string;
}

interface MultiFlowManagerProps {
  flows: AdditionalFlow[];
  onFlowsChange: (flows: AdditionalFlow[]) => void;
  questionType: string;
  options?: Array<{ value: string; label: string }>;
}

const MultiFlowManager = ({ flows, onFlowsChange, questionType, options = [] }: MultiFlowManagerProps) => {
  const [nextId, setNextId] = useState(flows.length + 1);

  const addFlow = () => {
    const newFlow: AdditionalFlow = {
      id: `flow-${nextId}`,
      answerValue: '',
      targetSubcategory: ''
    };
    onFlowsChange([...flows, newFlow]);
    setNextId(nextId + 1);
  };

  const updateFlow = (id: string, field: keyof AdditionalFlow, value: string) => {
    const updatedFlows = flows.map(flow =>
      flow.id === id ? { ...flow, [field]: value } : flow
    );
    onFlowsChange(updatedFlows);
  };

  const removeFlow = (id: string) => {
    const updatedFlows = flows.filter(flow => flow.id !== id);
    onFlowsChange(updatedFlows);
  };

  const isDropdownType = questionType === 'single_choice_dropdown' || questionType === 'multiple_choice_checkbox';

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg text-blue-700">Additional Subcategory Flows</CardTitle>
        <CardDescription>
          Define additional flows where different answers trigger different subcategories.
          This is in addition to the traditional subcategory settings above.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {flows.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No additional flows defined yet.</p>
            <p className="text-sm">Click "Add Flow" to create conditional subcategory logic.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flows.map((flow, index) => (
              <div key={flow.id} className="flex gap-3 items-end p-3 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground w-12">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <Label htmlFor={`answer-${flow.id}`} className="text-sm">
                    Answer Value
                  </Label>
                  {isDropdownType && options.length > 0 ? (
                    <select
                      id={`answer-${flow.id}`}
                      value={flow.answerValue}
                      onChange={(e) => updateFlow(flow.id, 'answerValue', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm"
                    >
                      <option value="">Select an option...</option>
                      {options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({option.value})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={`answer-${flow.id}`}
                      value={flow.answerValue}
                      onChange={(e) => updateFlow(flow.id, 'answerValue', e.target.value)}
                      placeholder="Enter answer value that triggers this flow"
                      className="text-sm"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor={`subcategory-${flow.id}`} className="text-sm">
                    Target Subcategory
                  </Label>
                  <Input
                    id={`subcategory-${flow.id}`}
                    value={flow.targetSubcategory}
                    onChange={(e) => updateFlow(flow.id, 'targetSubcategory', e.target.value)}
                    placeholder="Enter subcategory name"
                    className="text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeFlow(flow.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-between items-center pt-2">
          <div className="text-sm text-muted-foreground">
            {flows.length > 0 && `${flows.length} additional flow${flows.length > 1 ? 's' : ''} defined`}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFlow}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Flow
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiFlowManager;
