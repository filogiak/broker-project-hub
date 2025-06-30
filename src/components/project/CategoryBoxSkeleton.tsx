
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const CategoryBoxSkeleton = () => {
  return (
    <Card className="cursor-pointer bg-white border-2 border-form-green rounded-[12px] solid-shadow-green">
      <CardContent className="p-6">
        {/* Top section with icon and badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center">
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
          
          <Skeleton className="h-6 w-20 rounded-[8px]" />
        </div>

        {/* Content section */}
        <div className="space-y-3">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>

          {/* Progress bar skeleton */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>

          {/* Bottom section skeleton */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryBoxSkeleton;
