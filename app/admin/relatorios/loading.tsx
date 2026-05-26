export default function RelatoriosLoading() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-pulse">
      <div>
        <div className="h-7 w-28 bg-stone-100 rounded mb-1.5" />
        <div className="h-4 w-56 bg-stone-100 rounded" />
      </div>

      {Array.from({ length: 2 }).map((_, card) => (
        <div key={card} className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1.5">
              <div className="h-4 w-48 bg-stone-100 rounded" />
              <div className="h-3 w-32 bg-stone-100 rounded" />
            </div>
            <div className="h-8 w-28 bg-stone-100 rounded-md" />
          </div>
          <div className="space-y-0 divide-y divide-stone-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 bg-stone-100 rounded" />
                  <div className="h-3 w-20 bg-stone-100 rounded" />
                </div>
                <div className="h-5 w-16 bg-stone-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
