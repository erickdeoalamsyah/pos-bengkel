export default function AdminSegmentLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-40 rounded bg-white/10" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 bg-black">
            <div className="h-3 w-24 rounded bg-white/10 mb-3" />
            <div className="h-6 w-32 rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-4 bg-black">
        <div className="h-4 w-48 rounded bg-white/10 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 rounded bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
