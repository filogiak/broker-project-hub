
import React from 'react';
import { Input } from '@/components/ui/input';

interface NumberQuestionProps {
  value: number | string;
  onChange: (value: number | string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
}

const NumberQuestion = ({ 
  value, 
  onChange, 
  placeholder = "Enter number...",
  min,
  max,
  step = 1,
  required = false 
}: NumberQuestionProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty string for clearing
    if (inputValue === '') {
      onChange('');
      return;
    }

    // Convert to number if valid
    const numValue = Number(inputValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  return (
    <Input
      type="number"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      required={required}
    />
  );
};

export default NumberQuestion;
