export default function ClientesLoading() {
  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-24 bg-stone-100 rounded mb-1.5" />
          <div className="h-4 w-36 bg-stone-100 rounded" />
        </div>
        <div className="h-9 w-36 bg-stone-100 rounded-md" />
      </div>

      <div className="h-10 bg-stone-100 rounded-md" />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-stone-100">
          <div className="grid grid-cols-8 gap-4 px-4 py-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-3 bg-stone-100 rounded" />
            ))}
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="grid grid-cols-8 gap-4 px-4 py-4">
              <div className="h-4 w-28 bg-stone-100 rounded" />
              <div className="h-4 w-24 bg-stone-100 rounded" />
              <div className="h-5 w-20 bg-stone-100 rounded-full" />
              <div className="h-5 w-16 bg-stone-100 rounded-full" />
              <div className="h-4 w-12 bg-stone-100 rounded ml-auto" />
              <div className="h-4 w-16 bg-stone-100 rounded ml-auto" />
              <div className="h-4 w-20 bg-stone-100 rounded" />
              <div className="h-4 w-16 bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
