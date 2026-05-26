export default function PontosLoading() {
  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto animate-pulse">
      <div>
        <div className="h-7 w-36 bg-stone-100 rounded mb-1.5" />
        <div className="h-4 w-52 bg-stone-100 rounded" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <div className="h-9 w-24 bg-stone-100 rounded-md" />
        <div className="h-9 w-24 bg-stone-100 rounded-md" />
      </div>

      {/* Search */}
      <div className="h-10 bg-stone-100 rounded-md" />

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-stone-100">
          <div className="grid grid-cols-5 gap-4 px-4 py-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 bg-stone-100 rounded" />
            ))}
          </div>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 px-4 py-3.5">
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 bg-stone-100 rounded" />
                <div className="h-3 w-20 bg-stone-100 rounded" />
              </div>
              <div className="h-4 w-10 bg-stone-100 rounded" />
              <div className="h-4 w-24 bg-stone-100 rounded" />
              <div className="h-4 w-16 bg-stone-100 rounded" />
              <div className="h-5 w-14 bg-stone-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
