
import React, { useCallback } from 'react';
import { useItemOptions } from '@/hooks/useItemOptions';
import TextQuestion from './TextQuestion';
import NumberQuestion from './NumberQuestion';
import DateQuestion from './DateQuestion';
import SingleChoiceQuestion from './SingleChoiceQuestion';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import RepeatableGroupRenderer from './RepeatableGroupRenderer';

interface QuestionItem {
  id: string;
  itemId: string;
  itemName: string;
  itemType: string;
  displayValue?: any;
  priority?: number;
  // Add repeatable group specific fields
  repeatableGroupTitle?: string;
  repeatableGroupSubtitle?: string;
  repeatableGroupTopButtonText?: string;
  repeatableGroupStartButtonText?: string;
  repeatableGroupTargetTable?: string;
  subcategory?: string;
}

interface QuestionRendererProps {
  item: QuestionItem;
  currentValue: any;
  onChange: (itemId: string, value: any) => void;
  isAdditional?: boolean;
}

const QuestionRenderer = React.memo(({ 
  item, 
  currentValue, 
  onChange, 
  isAdditional = false 
}: QuestionRendererProps) => {
  const { options, loading: optionsLoading } = useItemOptions(item.itemId);

  const handleChange = useCallback((value: any) => {
    onChange(item.id, value);
  }, [item.id, onChange]);

  switch (item.itemType) {
    case 'text':
      return (
        <TextQuestion
          value={currentValue}
          onChange={handleChange}
          required
        />
      );

    case 'number':
      return (
        <NumberQuestion
          value={currentValue}
          onChange={handleChange}
          required
        />
      );

    case 'date':
      return (
        <DateQuestion
          value={currentValue}
          onChange={handleChange}
          required
        />
      );

    case 'single_choice_dropdown':
      return (
        <SingleChoiceQuestion
          value={currentValue}
          onChange={handleChange}
          options={options.map(opt => ({ value: opt.value, label: opt.label }))}
          disabled={optionsLoading}
          required
        />
      );

    case 'multiple_choice_checkbox':
      const selectedValues = Array.isArray(currentValue) ? currentValue : [];
      return (
        <MultipleChoiceQuestion
          value={selectedValues}
          onChange={handleChange}
          options={options.map(opt => ({ value: opt.value, label: opt.label }))}
          required
        />
      );

    case 'repeatable_group':
      // Use the new simple renderer
      const SimpleRepeatableGroupRenderer = React.lazy(() => import('./SimpleRepeatableGroupRenderer'));
      return (
        <React.Suspense fallback={<div>Loading...</div>}>
          <SimpleRepeatableGroupRenderer
            item={item}
            onChange={handleChange}
          />
        </React.Suspense>
      );

    case 'document':
      return null; // Documents are handled in DocumentsRenderer

    default:
      return <div className="text-muted-foreground">Unsupported question type: {item.itemType}</div>;
  }
});

QuestionRenderer.displayName = 'QuestionRenderer';

export default QuestionRenderer;
