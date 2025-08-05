export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary h-4 w-4 ${className}`}>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
