export function PlaceholderPage({ title, note }: { title: string; note: string }) {
  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">{title}</h1>
      <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
        {note}
      </div>
    </div>
  );
}
