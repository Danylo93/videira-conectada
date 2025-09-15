import { Grape } from "lucide-react";

type Props = {
  message?: string;
  tips?: string[];
};

export default function FancyLoader({
  message = "Carregando…",
  tips = [],
}: Props) {
  const tip =
    tips.length > 0 ? tips[Math.floor(Date.now() / 3000) % tips.length] : "";

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-gradient-to-br from-background via-background to-primary/10 px-4">
      <div className="relative w-full max-w-sm px-6 py-8 rounded-2xl border bg-background/85 backdrop-blur shadow-[0_0_40px_-10px_theme(colors.primary/50%)]">
        {/* orbit animation */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-primary/30 border-t-transparent" />
            <div className="absolute inset-2 animate-spin rounded-full border-2 border-primary/40 border-b-transparent" />
            <div className="absolute inset-4 animate-bounce">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 grid place-items-center shadow-md">
                <Grape className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* text */}
        <div className="pt-10 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Por favor, aguarde</p>
          <p className="text-lg font-semibold">{message}</p>
          {tip && (
            <p className="text-xs text-muted-foreground/80 mt-1 animate-pulse">
              {tip}
            </p>
          )}
        </div>

        {/* progress shimmer */}
        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-loader-bar rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
