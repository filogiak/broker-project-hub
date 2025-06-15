
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SelectOption {
  value: string;
  label: string;
}

interface SingleChoiceQuestionProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
}

const SingleChoiceQuestion = ({ 
  value, 
  onChange, 
  options,
  placeholder = "Select an option...",
  required = false 
}: SingleChoiceQuestionProps) => {
  return (
    <Select
      value={value}
      onValueChange={onChange}
      required={required}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white border shadow-lg z-50">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SingleChoiceQuestion;
