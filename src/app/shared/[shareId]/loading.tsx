import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <Spinner className="size-5" aria-hidden="true" />
      <span className="sr-only">Loading shared content...</span>
    </div>
  );
}
