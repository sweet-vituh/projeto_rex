import { cn } from "@/lib/utils";

interface BadgeStatusProps {
  status: "pendente" | "em_andamento" | "pre_liberacao" | "coleta_emitida" | "material_disponivel" | "concluido" | "encerrada_sem_liberacao" | "rejeitado" | "caducou";
  className?: string;
}

const statusLabels = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  pre_liberacao: "Pré-Liberação",
  coleta_emitida: "Coleta Emitida",
  material_disponivel: "Material Disponível",
  concluido: "Concluído",
  encerrada_sem_liberacao: "Encerrada Sem Liberação",
  rejeitado: "Rejeitado",
  caducou: "Caducou",
};

const statusVariants = {
  pendente: "bg-muted text-muted-foreground border-border",
  em_andamento: "bg-status-normal/10 text-status-normal border-status-normal/20",
  pre_liberacao: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  coleta_emitida: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  material_disponivel: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  concluido: "bg-green-500/10 text-green-600 border-green-500/20",
  encerrada_sem_liberacao: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  rejeitado: "bg-destructive/10 text-destructive border-destructive/20",
  caducou: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
};

export function BadgeStatus({ status, className }: BadgeStatusProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        statusVariants[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
