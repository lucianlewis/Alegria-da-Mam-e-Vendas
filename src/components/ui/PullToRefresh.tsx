import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, PanInfo } from 'motion/react';
import { Loader2, RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, className }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const controls = useAnimation();
  const pullThreshold = 80;

  const handlePan = (_: any, info: PanInfo) => {
    if (isRefreshing || window.scrollY > 0) return;
    
    const pull = Math.max(0, info.offset.y);
    const progress = Math.min(1, pull / pullThreshold);
    setPullProgress(progress);
    
    controls.set({ y: pull * 0.5 });
  };

  const handlePanEnd = async (_: any, info: PanInfo) => {
    if (isRefreshing || window.scrollY > 0) return;

    if (info.offset.y >= pullThreshold) {
      setIsRefreshing(true);
      setPullProgress(1);
      
      // Keep it at threshold while refreshing
      await controls.start({ y: 60 });
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullProgress(0);
        await controls.start({ y: 0 });
      }
    } else {
      setPullProgress(0);
      await controls.start({ y: 0 });
    }
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Pull indicator */}
      <div 
        className="absolute top-0 left-0 w-full flex justify-center pointer-events-none z-50"
        style={{ height: 60 }}
      >
        <motion.div
          style={{ 
            opacity: pullProgress,
            scale: pullProgress,
            y: pullProgress * 20
          }}
          className="bg-primary size-10 rounded-full flex items-center justify-center shadow-lg shadow-primary/20"
        >
          {isRefreshing ? (
            <Loader2 className="animate-spin text-white" size={20} />
          ) : (
            <RefreshCw 
              className="text-white" 
              size={20} 
              style={{ transform: `rotate(${pullProgress * 360}deg)` }} 
            />
          )}
        </motion.div>
      </div>

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.5}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        animate={controls}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
