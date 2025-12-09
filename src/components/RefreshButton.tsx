import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RefreshButtonProps {
  onClick: () => void;
  isRefreshing?: boolean;
}

export function RefreshButton({ onClick, isRefreshing = false }: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={isRefreshing}
      className="transition-all duration-200"
      title="Atualizar"
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
    </Button>
  );
}
