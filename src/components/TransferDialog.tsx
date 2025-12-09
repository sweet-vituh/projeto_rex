import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newPcmId: string) => void;
  currentPcmId: string;
}

interface PCMUser {
  user_id: string;
  username: string;
}

export function TransferDialog({ open, onOpenChange, onConfirm, currentPcmId }: TransferDialogProps) {
  const [pcmUsers, setPcmUsers] = useState<PCMUser[]>([]);
  const [selectedPcm, setSelectedPcm] = useState<string>("");

  useEffect(() => {
    const fetchPCMUsers = async () => {
      console.log('Buscando PCMs, currentPcmId:', currentPcmId);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, username')
        .eq('role', 'pcm')
        .neq('user_id', currentPcmId);

      console.log('PCMs encontrados:', data);
      console.log('Erro:', error);

      if (!error && data) {
        setPcmUsers(data);
      }
    };

    if (open) {
      fetchPCMUsers();
    }
  }, [open, currentPcmId]);

  const handleConfirm = () => {
    if (selectedPcm) {
      onConfirm(selectedPcm);
      setSelectedPcm("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="animate-scale-in">
        <AlertDialogHeader>
          <AlertDialogTitle>Transferir Requisição</AlertDialogTitle>
          <AlertDialogDescription>
            Selecione o PCM que ficará responsável por esta requisição.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label>PCM Destino</Label>
          <Select value={selectedPcm} onValueChange={setSelectedPcm}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Selecione um PCM" />
            </SelectTrigger>
            <SelectContent>
              {pcmUsers.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  Nenhum outro PCM disponível
                </div>
              ) : (
                pcmUsers.map((pcm) => (
                  <SelectItem key={pcm.user_id} value={pcm.user_id}>
                    {pcm.username}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {pcmUsers.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Certifique-se de que existem outros usuários PCM cadastrados no sistema.
            </p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="transition-all duration-200">Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            disabled={!selectedPcm}
            className="transition-all duration-200"
          >
            Confirmar Transferência
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
