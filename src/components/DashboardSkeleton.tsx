import React from 'react';
import { Skeleton } from './ui/Skeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between py-2">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton variant="circle" className="size-10" />
          <Skeleton variant="circle" className="size-10" />
        </div>
      </header>

      {/* Tab Bar */}
      <div className="bg-[var(--card-bg)] p-1 rounded-2xl flex gap-1 border border-[var(--border-color)]">
        <Skeleton className="flex-1 h-12 rounded-xl" />
        <Skeleton className="flex-1 h-12 rounded-xl" />
        <Skeleton className="flex-1 h-12 rounded-xl" />
      </div>

      {/* Custom Option */}
      <Skeleton className="w-full h-14 rounded-2xl" />

      <div className="flex gap-4">
        <Skeleton className="flex-1 h-24 rounded-2xl" />
        <Skeleton className="flex-1 h-24 rounded-2xl" />
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--border-color)] space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>

      {/* Channel Chart */}
      <div className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--border-color)] space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex flex-col items-center py-4 space-y-6">
          <Skeleton variant="circle" className="size-48" />
          <div className="w-full space-y-4">
            <Skeleton className="h-6 w-full rounded-xl" />
            <Skeleton className="h-6 w-full rounded-xl" />
            <Skeleton className="h-6 w-full rounded-xl" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
};
