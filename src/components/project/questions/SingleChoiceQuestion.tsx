
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
  disabled?: boolean;
}

const SingleChoiceQuestion = React.memo(({ 
  value, 
  onChange, 
  options,
  placeholder = "Select an option...",
  required = false,
  disabled = false
}: SingleChoiceQuestionProps) => {
  return (
    <Select
      value={value}
      onValueChange={onChange}
      required={required}
      disabled={disabled}
    >
      <SelectTrigger className="w-full bg-white border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent 
        className="bg-white border border-gray-200 shadow-lg z-[200] max-h-60 overflow-y-auto"
        position="popper"
        sideOffset={4}
        align="start"
      >
        {options.length > 0 ? (
          options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="cursor-pointer hover:bg-gray-50 focus:bg-blue-50 focus:text-blue-900 px-3 py-2"
            >
              {option.label}
            </SelectItem>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-gray-500">
            No options available
          </div>
        )}
      </SelectContent>
    </Select>
  );
});

SingleChoiceQuestion.displayName = 'SingleChoiceQuestion';

export default SingleChoiceQuestion;
