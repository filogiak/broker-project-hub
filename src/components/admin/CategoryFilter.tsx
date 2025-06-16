
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: string;
  name: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  questionCounts: Record<string, number>;
}

const CategoryFilter = ({ categories, selectedCategory, onCategorySelect, questionCounts }: CategoryFilterProps) => {
  const totalQuestions = Object.values(questionCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border">
      <Button
        variant={selectedCategory === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onCategorySelect('all')}
        className="flex items-center gap-2"
      >
        All Categories
        <Badge variant="secondary" className="ml-1">
          {totalQuestions}
        </Badge>
      </Button>
      
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategorySelect(category.id)}
          className="flex items-center gap-2"
        >
          {category.name}
          <Badge variant="secondary" className="ml-1">
            {questionCounts[category.id] || 0}
          </Badge>
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
