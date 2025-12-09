import { cn } from "@/lib/utils";

interface BadgePriorityProps {
  priority: "Baixa" | "Normal" | "Urgente";
  className?: string;
}

export function BadgePriority({ priority, className }: BadgePriorityProps) {
  const variants = {
    Baixa: "bg-status-low/10 text-status-low border-status-low/20",
    Normal: "bg-status-normal/10 text-status-normal border-status-normal/20",
    Urgente: "bg-status-urgent/10 text-status-urgent border-status-urgent/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[priority],
        className
      )}
    >
      {priority}
    </span>
  );
}
