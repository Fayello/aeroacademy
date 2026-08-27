export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header shimmer */}
      <div className="h-12 bg-white/5 dark:bg-slate-800 border-b border-white/10 dark:border-slate-700" />

      {/* Content area shimmer */}
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        {/* Page header shimmer */}
        <div className="space-y-3 animate-fade-in-up">
          <div className="h-8 w-48 bg-white/10 dark:bg-slate-700 rounded-lg" />
          <div className="h-4 w-72 bg-white/5 dark:bg-slate-800 rounded-lg" />
        </div>

        {/* Cards shimmer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`rounded-xl border border-white/10 dark:border-slate-700 p-5 space-y-3 animate-fade-in-up animate-delay-${i}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 dark:bg-slate-700 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 bg-white/10 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-16 bg-white/5 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-white/5 dark:bg-slate-800 rounded" />
              <div className="h-3 w-3/4 bg-white/5 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>

        {/* Table shimmer */}
        <div className="rounded-xl border border-white/10 dark:border-slate-700 overflow-hidden animate-fade-in-up animate-delay-4">
          <div className="h-10 bg-white/5 dark:bg-slate-800/50 border-b border-white/10 dark:border-slate-700" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 border-b border-white/10 dark:border-slate-800 last:border-0 flex items-center px-4 gap-4">
              <div className="w-8 h-8 bg-white/10 dark:bg-slate-700 rounded-lg" />
              <div className="h-4 flex-1 bg-white/5 dark:bg-slate-800 rounded" />
              <div className="h-4 w-20 bg-white/5 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
