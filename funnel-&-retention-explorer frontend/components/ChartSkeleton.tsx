import React from 'react';

type SkeletonVariant = 'bar' | 'area' | 'table';

interface ChartSkeletonProps {
  variant?: SkeletonVariant;
  rows?: number;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = React.memo(({ variant = 'bar', rows = 5 }) => {
  if (variant === 'table') {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-10 bg-white/5 rounded" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-8 bg-white/[0.03] rounded" />
        ))}
      </div>
    );
  }

  if (variant === 'area') {
    return (
      <div className="animate-pulse h-[300px] flex items-end gap-1 px-4 pb-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-white/[0.03] rounded-t"
            style={{ height: `${30 + Math.sin(i * 0.8) * 25 + 20}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse h-[320px] flex items-end gap-3 px-4 pb-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-white/[0.03] rounded-t"
          style={{ height: `${90 - i * 15}%` }}
        />
      ))}
    </div>
  );
});
