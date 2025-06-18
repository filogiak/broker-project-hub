
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SelectOption {
  value: string;
  label: string;
}

interface SingleChoiceQuestionProps {
  value: string | boolean | number;
  onChange: (value: string | boolean | number) => void;
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
  
  // Convert the value to string for the Select component
  const stringValue = value !== null && value !== undefined ? String(value) : '';
  
  // Handle value conversion when selection changes
  const handleValueChange = (selectedValue: string) => {
    console.log('SingleChoiceQuestion value change:', selectedValue);
    
    // Try to convert back to original type if it was boolean or number
    if (selectedValue.toLowerCase() === 'true') {
      onChange(true);
    } else if (selectedValue.toLowerCase() === 'false') {
      onChange(false);
    } else {
      // Check if it's a number
      const numValue = Number(selectedValue);
      if (!isNaN(numValue) && selectedValue.trim() !== '') {
        onChange(numValue);
      } else {
        onChange(selectedValue);
      }
    }
  };

  return (
    <Select
      value={stringValue}
      onValueChange={handleValueChange}
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
