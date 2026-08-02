import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recentSaturdays } from "@/lib/saturdays";

const labelOf = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

interface Props {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  /** Quantos sábados listar (padrão: 10) */
  weeks?: number;
  /**
   * Sábados que já possuem relatório desta célula (YYYY-MM-DD). Ficam
   * bloqueados na lista para não duplicar — o banco também tem UNIQUE
   * (lider_id, week_start), então isso evita o erro antes de acontecer.
   */
  usedDates?: string[];
}

/**
 * Seletor da semana do relatório: a célula é aos sábados, então só sábados
 * são ofertados — impossível escolher a data errada. Se o valor atual for de
 * um relatório antigo fora da janela, ele entra no topo da lista.
 */
export function SaturdaySelect({ id, value, onChange, weeks = 10, usedDates = [] }: Props) {
  const used = useMemo(() => new Set(usedDates.map((d) => d.slice(0, 10))), [usedDates]);

  const options = useMemo(() => {
    const sats = recentSaturdays(weeks);
    const current = value?.slice(0, 10);
    if (current && !sats.includes(current)) sats.unshift(current);
    return sats;
  }, [value, weeks]);

  return (
    <Select value={value ? value.slice(0, 10) : undefined} onValueChange={onChange}>
      <SelectTrigger id={id} className="capitalize">
        <SelectValue placeholder="Selecione o sábado da célula" />
      </SelectTrigger>
      <SelectContent>
        {options.map((iso) => {
          const isUsed = used.has(iso);
          return (
            <SelectItem key={iso} value={iso} disabled={isUsed} className="capitalize">
              {labelOf(iso)}
              {isUsed && (
                <span className="ml-2 text-xs normal-case text-muted-foreground">
                  · já preenchido
                </span>
              )}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
