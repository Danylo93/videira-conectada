import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  /** Mantidos por compatibilidade com os usos existentes; o skeleton não exibe textos. */
  message?: string;
  tips?: string[];
};

/**
 * Loading de página em formato skeleton: blocos neutros pulsando no lugar do
 * conteúdo (hero, cartões de indicadores e gráficos), sem card central nem
 * textos. Substitui a versão anterior com anéis/frases a pedido do usuário.
 */
export default function FancyLoader(_props: Props) {
  return (
    <div
      className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-6"
      role="status"
      aria-busy="true"
      aria-label="Carregando"
    >
      {/* Hero */}
      <Skeleton className="h-28 sm:h-36 rounded-2xl" />

      {/* Cartões de indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>

      {/* Gráficos / listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Skeleton className="h-56 sm:h-72 rounded-xl" />
        <Skeleton className="h-56 sm:h-72 rounded-xl hidden sm:block" />
      </div>
    </div>
  );
}
