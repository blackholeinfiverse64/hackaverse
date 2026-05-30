export const CardSkeleton = () => (
  <div className="glass-card rounded-2xl border border-white/10 p-5 animate-pulse">
    <div className="h-4 bg-white/10 rounded w-3/4 mb-3"></div>
    <div className="h-3 bg-white/5 rounded w-1/2 mb-4"></div>
    <div className="space-y-2">
      <div className="h-3 bg-white/5 rounded w-full"></div>
      <div className="h-3 bg-white/5 rounded w-5/6"></div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
    <div className="bg-white/5 border-b border-white/10 p-4">
      <div className="h-4 bg-white/10 rounded w-1/4"></div>
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="border-b border-white/5 p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="h-3 bg-white/5 rounded flex-1"></div>
          <div className="h-3 bg-white/5 rounded w-24"></div>
          <div className="h-3 bg-white/5 rounded w-16"></div>
        </div>
      </div>
    ))}
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div>
      <div className="h-3 bg-white/10 rounded w-24 mb-2"></div>
      <div className="h-10 bg-white/5 rounded w-full"></div>
    </div>
    <div>
      <div className="h-3 bg-white/10 rounded w-32 mb-2"></div>
      <div className="h-24 bg-white/5 rounded w-full"></div>
    </div>
    <div className="h-10 bg-white/10 rounded w-32"></div>
  </div>
);
