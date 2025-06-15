
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Folder } from 'lucide-react';

interface CategoryBoxProps {
  name: string;
  onClick: () => void;
}

const CategoryBox = ({ name, onClick }: CategoryBoxProps) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        <Folder className="h-12 w-12 text-primary mb-3" />
        <h3 className="text-lg font-semibold">{name}</h3>
      </CardContent>
    </Card>
  );
};

export default CategoryBox;
