
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CheckboxOption {
  value: string;
  label: string;
}

interface MultipleChoiceQuestionProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: CheckboxOption[];
  required?: boolean;
}

const MultipleChoiceQuestion = ({ 
  value, 
  onChange, 
  options,
  required = false 
}: MultipleChoiceQuestionProps) => {
  const handleOptionChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter(v => v !== optionValue));
    }
  };

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-3">
          <Checkbox
            id={`option-${option.value}`}
            checked={value.includes(option.value)}
            onCheckedChange={(checked) => handleOptionChange(option.value, !!checked)}
            required={required && value.length === 0}
          />
          <Label 
            htmlFor={`option-${option.value}`} 
            className="text-sm font-normal cursor-pointer"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
};

export default MultipleChoiceQuestion;
