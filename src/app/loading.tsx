export default function Loading() {
  return (
    <main className="px-6 pt-10 pb-16 md:px-10">
      <p role="status" className="font-pixel text-sm text-p2">
        &gt; Now loading<span className="motion-safe:animate-pulse">_</span>
      </p>
      <div aria-hidden="true" className="mt-8 flex flex-col gap-4">
        <div className="h-10 w-2/3 max-w-md motion-safe:animate-pulse bg-line/60" />
        <div className="h-4 w-1/2 max-w-sm motion-safe:animate-pulse bg-line/40" />
      </div>
      <ul aria-hidden="true" className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }, (_, index) => (
          <li key={index} className="flex flex-col gap-4">
            <div className="aspect-[3/4] w-full motion-safe:animate-pulse bg-line/40" />
            <div className="h-3 w-3/4 motion-safe:animate-pulse bg-line/40" />
          </li>
        ))}
      </ul>
    </main>
  );
}
