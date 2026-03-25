"use client";

interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  borderRadius?: string | number;
}

export function Skeleton({ className = "", height, width, borderRadius = 8 }: SkeletonProps) {
  return (
    <div
      className={`shimmer ${className}`}
      style={{
        background: "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s linear infinite",
        borderRadius,
        height,
        width,
      }}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card p-4 space-y-2">
      <Skeleton height={12} width="60%" borderRadius={4} />
      <Skeleton height={28} width="80%" borderRadius={4} />
    </div>
  );
}

export function WorkoutCardSkeleton() {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton height={44} width={44} borderRadius={12} />
        <div className="flex-1 space-y-2">
          <Skeleton height={16} width="70%" borderRadius={4} />
          <Skeleton height={12} width="50%" borderRadius={4} />
        </div>
      </div>
    </div>
  );
}
