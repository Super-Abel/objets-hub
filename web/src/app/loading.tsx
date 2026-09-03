export default function HomeLoading() {
  return (
    <div className="grid gap-8 md:grid-cols-[320px_1fr]">
      <div className="h-64 rounded-lg border bg-muted/40" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 rounded-lg border bg-muted/40" />
        ))}
      </div>
    </div>
  );
}
