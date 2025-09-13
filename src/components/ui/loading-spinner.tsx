import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: number;
}

export function LoadingSpinner({ className, size = 32 }: Props) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className="animate-spin rounded-full border-b-2 border-primary"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

export default LoadingSpinner;
