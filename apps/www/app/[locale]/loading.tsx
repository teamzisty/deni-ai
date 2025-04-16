import { Loading as Loading2 } from "@/components/loading";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center">
        <Loading2 />
    </div>
  );
}
