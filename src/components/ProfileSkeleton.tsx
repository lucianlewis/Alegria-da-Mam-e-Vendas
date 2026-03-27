import React from 'react';
import { Skeleton } from './ui/Skeleton';

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between py-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton variant="circle" className="size-10" />
      </header>

      {/* Profile Info Card */}
      <div className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--border-color)] flex items-center gap-6">
        <Skeleton variant="circle" className="size-20" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>

      {/* Management Section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4 border-b border-[var(--border-color)] last:border-b-0">
              <Skeleton variant="circle" className="size-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Preferences Section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4 border-b border-[var(--border-color)] last:border-b-0">
              <Skeleton variant="circle" className="size-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Logout & Version */}
      <div className="flex flex-col items-center gap-4 pt-4">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
};
