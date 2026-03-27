import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'rect' }) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-slate-200 dark:bg-white/10",
        variant === 'circle' ? "rounded-full" : "rounded-lg",
        className
      )}
    >
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent"
      />
    </div>
  );
};
