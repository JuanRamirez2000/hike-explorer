"use client";

export default function MapError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body gap-4 items-center text-center">
          <h2 className="card-title">Map failed to load</h2>
          <p className="text-base-content/60 text-sm">{error.message}</p>
          <button className="btn btn-primary" onClick={reset}>
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
