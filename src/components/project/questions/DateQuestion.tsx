
import React from 'react';
import { Input } from '@/components/ui/input';

interface DateQuestionProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
}

const DateQuestion = ({ 
  value, 
  onChange, 
  min,
  max,
  required = false 
}: DateQuestionProps) => {
  return (
    <Input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      max={max}
      required={required}
    />
  );
};

export default DateQuestion;
