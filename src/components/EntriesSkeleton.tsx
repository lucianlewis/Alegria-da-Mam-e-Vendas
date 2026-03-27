import React from 'react';
import { Skeleton } from './ui/Skeleton';

export const EntriesSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between py-2">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton variant="circle" className="size-10" />
          <Skeleton variant="circle" className="size-10" />
        </div>
      </header>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>

      {/* Grand Total Card */}
      <Skeleton className="h-28 w-full rounded-3xl" />

      {/* Sellers Performance Section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
};
