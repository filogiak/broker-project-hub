
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TextQuestionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isMultiline?: boolean;
  required?: boolean;
}

const TextQuestion = ({ 
  value, 
  onChange, 
  placeholder = "Enter text...",
  isMultiline = false,
  required = false 
}: TextQuestionProps) => {
  if (isMultiline) {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[100px]"
        required={required}
      />
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full"
      required={required}
    />
  );
};

export default TextQuestion;
