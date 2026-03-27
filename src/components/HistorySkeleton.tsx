import React from 'react';
import { Skeleton } from './ui/Skeleton';

export const HistorySkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between py-2">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton variant="circle" className="size-10" />
          <Skeleton variant="circle" className="size-10" />
        </div>
      </header>

      {/* Daily Summary List */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--border-color)] space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
