
import React, { useCallback } from 'react';
import { useItemOptions } from '@/hooks/useItemOptions';
import { useParams } from 'react-router-dom';
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
  participantDesignation?: string;
  repeatable_group_title?: string;
  repeatable_group_subtitle?: string;
  repeatable_group_top_button_text?: string;
  repeatable_group_start_button_text?: string;
  repeatable_group_target_table?: 'project_secondary_incomes' | 'project_dependents' | 'project_debts';
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
  const { projectId } = useParams();
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
      return (
        <RepeatableGroupRenderer
          item={item}
          currentValue={currentValue}
          onChange={handleChange}
          projectId={projectId!}
          participantDesignation={item.participantDesignation}
        />
      );

    case 'document':
      return null; // Documents are handled in DocumentsRenderer

    default:
      return <div className="text-muted-foreground">Unsupported question type: {item.itemType}</div>;
  }
});

QuestionRenderer.displayName = 'QuestionRenderer';

export default QuestionRenderer;
