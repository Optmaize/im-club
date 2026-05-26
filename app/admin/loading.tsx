export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
      <div>
        <div className="h-7 w-32 bg-stone-100 rounded mb-1.5" />
        <div className="h-4 w-48 bg-stone-100 rounded" />
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border-0">
            <div className="h-3 w-20 bg-stone-100 rounded mb-3" />
            <div className="h-7 w-16 bg-stone-100 rounded" />
          </div>
        ))}
      </div>

      {/* Chart + recent attendances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="h-4 w-40 bg-stone-100 rounded mb-6" />
          <div className="h-[220px] bg-stone-100 rounded" />
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="h-4 w-40 bg-stone-100 rounded mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between py-2">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 bg-stone-100 rounded" />
                  <div className="h-3 w-20 bg-stone-100 rounded" />
                </div>
                <div className="h-4 w-16 bg-stone-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
