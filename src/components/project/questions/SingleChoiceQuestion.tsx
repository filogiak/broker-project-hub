
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

const SingleChoiceQuestion = React.memo(({ 
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
      <SelectContent 
        className="bg-white border shadow-lg z-[100] pointer-events-auto"
        position="popper"
        sideOffset={4}
      >
        {options.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

SingleChoiceQuestion.displayName = 'SingleChoiceQuestion';

export default SingleChoiceQuestion;
