import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BadgeStatus } from "@/components/ui/badge-status";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, XCircle, User, Calendar, HardHat, Ban } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EpiRequisition, EpiStatus } from "@/types/epi";
import { supabase } from "@/integrations/supabase/client";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

const EpiRequisitionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [requisition, setRequisition] = useState<EpiRequisition | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('epi_requisitions')
        .select(`
          *,
          epi_item:epi_items (id, name, category, size, stock_quantity, min_stock_quantity),
          requester_username:user_roles (username)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar requisição de EPI:', error);
        toast({
          title: "Erro ao carregar requisição de EPI",
          description: "Não foi possível carregar os detalhes",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setRequisition({
          ...data,
          epi_item: data.epi_item as EpiRequisition['epi_item'],
          requester_username: (data.requester_username as { username: string } | null)?.username || 'Usuário Desconhecido',
        });
      }
    };

    fetchData();
  }, [id, toast, user]);

  const handleApprove = async () => {
    setIsLoadingAction(true);
    if (!user || !requisition) return;

    try {
      const { error: updateError } = await supabase
        .from('epi_requisitions')
        .update({ 
          status: 'aprovado',
          assigned_to: user.id // Assign to the security technician who approved it
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast({
        title: "Requisição de EPI aprovada!",
        description: "O solicitante será notificado.",
      });
      setRequisition(prev => prev ? { ...prev, status: 'aprovado', assigned_to: user.id } : null);
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar requisição",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleReject = async () => {
    setIsLoadingAction(true);
    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo da rejeição",
        variant: "destructive",
      });
      setIsLoadingAction(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('epi_requisitions')
        .update({ 
          status: 'recusado',
          rejection_reason: rejectionReason,
          assigned_to: null // Clear assignment on rejection
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Requisição de EPI recusada",
        description: "O solicitante foi notificado.",
      });
      setShowRejectDialog(false);
      setRequisition(prev => prev ? { ...prev, status: 'recusado', rejection_reason: rejectionReason, assigned_to: null } : null);
    } catch (error: any) {
      toast({
        title: "Erro ao recusar requisição",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleMarkAsDelivered = async () => {
    setIsLoadingAction(true);
    if (!user || !requisition) return;

    try {
      // First, update the EPI item's stock quantity
      const currentEpiItem = requisition.epi_item;
      if (!currentEpiItem) throw new Error("EPI item not found.");

      const newStockQuantity = currentEpiItem.stock_quantity - requisition.quantity;
      if (newStockQuantity < 0) {
        throw new Error("Estoque insuficiente para marcar como entregue.");
      }

      const { error: stockUpdateError } = await supabase
        .from('epi_items')
        .update({ stock_quantity: newStockQuantity })
        .eq('id', currentEpiItem.id);

      if (stockUpdateError) throw stockUpdateError;

      // Then, update the requisition status
      const { error: requisitionUpdateError } = await supabase
        .from('epi_requisitions')
        .update({ 
          status: 'entregue',
          assigned_to: null // Clear assignment on delivery
        })
        .eq('id', id);

      if (requisitionUpdateError) throw requisitionUpdateError;

      // Record the movement in epi_movements
      const { error: movementError } = await supabase
        .from('epi_movements')
        .insert({
          epi_item_id: currentEpiItem.id,
          type: 'saida',
          quantity: requisition.quantity,
          performed_by: user.id,
        });

      if (movementError) console.error("Error recording EPI movement:", movementError); // Log but don't block

      toast({
        title: "EPI marcado como entregue!",
        description: "Estoque atualizado e solicitante notificado.",
      });
      setRequisition(prev => prev ? { ...prev, status: 'entregue', assigned_to: null } : null);
    } catch (error: any) {
      toast({
        title: "Erro ao marcar como entregue",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  if (!requisition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const isSecurityTechnician = role === "tecnico_seguranca";
  const isRequester = user?.id === requisition.user_id;
  const canTakeActions = isSecurityTechnician && requisition.status === "pendente";
  const canMarkAsDelivered = isSecurityTechnician && requisition.status === "aprovado";

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm pointer-events-auto">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="transition-all duration-200 hover:bg-accent pointer-events-auto">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Detalhes da Requisição de EPI</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        {/* Status */}
        <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <BadgeStatus status={requisition.status} />
            </div>
          </CardContent>
        </Card>

        {/* EPI Item Info */}
        <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardHat className="w-5 h-5 text-primary" />
              EPI Solicitado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Nome do EPI</Label>
              <p className="font-medium mt-1">{requisition.epi_item?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Categoria</Label>
                <p className="font-medium mt-1">{requisition.epi_item?.category}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Tamanho/Especificação</Label>
                <p className="font-medium mt-1">{requisition.epi_item?.size || 'N/A'}</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mt-1">Quantidade Solicitada: {requisition.quantity}</p>
              <p className="text-sm text-muted-foreground mt-1">Estoque Atual: {requisition.epi_item?.stock_quantity}</p>
            </div>
          </CardContent>
        </Card>

        {/* Observation */}
        {requisition.observation && (
          <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Observação do Solicitante</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{requisition.observation}</p>
            </CardContent>
          </Card>
        )}

        {/* Rejection Reason */}
        {requisition.rejection_reason && requisition.status === "recusado" && (
          <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200 border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Motivo da Recusa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{requisition.rejection_reason}</p>
            </CardContent>
          </Card>
        )}

        {/* Requester Info */}
        <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Solicitante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{requisition.requester_username}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(requisition.created_at).toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>

        {/* Actions for Security Technician - Pending */}
        {canTakeActions && (
          <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="success"
                className="w-full transition-all duration-200 hover:scale-105" 
                onClick={handleApprove}
                disabled={isLoadingAction}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isLoadingAction ? "Aprovando..." : "Aprovar Requisição"}
              </Button>
              <Button
                variant="destructive"
                className="w-full transition-all duration-200 hover:scale-105"
                onClick={() => setShowRejectDialog(true)}
                disabled={isLoadingAction}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Recusar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actions for Security Technician - Approved */}
        {canMarkAsDelivered && (
          <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Gerenciar Entrega</CardTitle>
              <CardDescription>Marque como entregue após a retirada do EPI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="default"
                className="w-full transition-all duration-200 hover:scale-105" 
                onClick={handleMarkAsDelivered}
                disabled={isLoadingAction}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isLoadingAction ? "Registrando Entrega..." : "Marcar como Entregue"}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar Requisição de EPI</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da recusa. Esta informação será enviada ao solicitante.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Descreva o motivo da recusa..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="transition-all duration-200" disabled={isLoadingAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200" disabled={isLoadingAction}>
              {isLoadingAction ? "Recusando..." : "Confirmar Recusa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EpiRequisitionDetail;