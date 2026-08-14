export const Skeleton = ({ rows = 5, cols = 4 }) => (
  <div className="p-4 space-y-3">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4">
        {Array.from({ length: cols }).map((__, c) => (
          <div key={c} className="h-4 bg-slate-100 rounded animate-pulse flex-1" />
        ))}
      </div>
    ))}
  </div>
);
