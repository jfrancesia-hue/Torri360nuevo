export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-lg" />)}
      </div>
      <div className="h-64 bg-muted rounded-lg" />
    </div>
  );
}
