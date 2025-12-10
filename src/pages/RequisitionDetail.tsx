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
import { BadgePriority } from "@/components/ui/badge-priority";
import { BadgeStatus } from "@/components/ui/badge-status";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, XCircle, User, Calendar, Package, MapPin, Users, Ban } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Requisition } from "@/types/requisition";
import { supabase } from "@/integrations/supabase/client";
import { ImageModal } from "@/components/ImageModal";
import { TransferDialog } from "@/components/TransferDialog";
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

const RequisitionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [requisition, setRequisition] = useState<Requisition | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCaducouDialog, setShowCaducouDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [caducouReason, setCaducouReason] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [transferredFromName, setTransferredFromName] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Buscar requisição do Supabase
      const { data, error } = await supabase
        .from('requisitions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar requisição:', error);
        toast({
          title: "Erro ao carregar requisição",
          description: "Não foi possível carregar os detalhes",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        // Buscar username do criador
        const { data: userData } = await supabase
          .from('user_roles')
          .select('username')
          .eq('user_id', data.created_by)
          .single();

        // Buscar username de quem transferiu (se aplicável)
        if (data.transferred_from) {
          const { data: transferData } = await supabase
            .from('user_roles')
            .select('username')
            .eq('user_id', data.transferred_from)
            .single();
          
          if (transferData) {
            setTransferredFromName(transferData.username);
          }
        }

        setRequisition({
          ...data,
          created_by: userData?.username || 'Usuário',
        } as Requisition);
      }
    };

    fetchData();
  }, [id, toast, user]);

  const handleTakeRequisition = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('requisitions')
      .update({ 
        status: 'em_andamento',
        assigned_to: user.id 
      })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao assumir requisição",
        description: "Tente novamente",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Requisição assumida",
      description: "Você agora é responsável por esta requisição",
    });
    
    navigate("/minhas-requisicoes");
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo da rejeição",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('requisitions')
      .update({ 
        status: 'rejeitado',
        rejection_reason: rejectionReason,
        assigned_to: null // Liberar requisição ao rejeitar
      })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao rejeitar requisição",
        description: "Tente novamente",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Requisição rejeitada",
      description: "O solicitante foi notificado",
    });
    setShowRejectDialog(false);
    navigate("/inbox");
  };

  const handleCaducou = async () => {
    if (!caducouReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo do caducamento",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('requisitions')
      .update({ 
        status: 'caducou',
        rejection_reason: caducouReason,
        assigned_to: null // Liberar requisição ao marcar como caducou
      })
      .eq('id', id);

    if (error) {
      toast({
        title: "Requisição marcada como caducou",
        description: "O solicitante foi notificado",
      });
      return;
    }

    toast({
      title: "Requisição marcada como caducou",
      description: "O solicitante foi notificado",
    });
    setShowCaducouDialog(false);
    navigate("/minhas-requisicoes");
  };

  const handleStatusChange = async (newStatus: string) => {
    let updateData: Partial<Requisition> = { status: newStatus as any };

    // Se mudar para 'material_disponivel' ou 'encerrada_sem_liberacao', liberar a requisição
    if (newStatus === "material_disponivel" || newStatus === "encerrada_sem_liberacao") {
      updateData.assigned_to = null;
    }

    const { error } = await supabase
      .from('requisitions')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
      return;
    }

    const statusLabels: Record<string, string> = {
      pre_liberacao: "Pré-Liberação",
      coleta_emitida: "Coleta Emitida", 
      material_disponivel: "Material Disponível",
      concluido: "Concluído",
      encerrada_sem_liberacao: "Encerrada Sem Liberação",
    };

    toast({
      title: "Status atualizado",
      description: `Requisição marcada como: ${statusLabels[newStatus] || newStatus}`,
    });

    // Atualizar requisição local
    if (requisition) {
      setRequisition({ ...requisition, ...updateData });
    }
  };

  const handleTransfer = async (newPcmId: string) => {
    if (!user) return;
    
    // Buscar o nome do PCM destino
    const { data: pcmData } = await supabase
      .from('user_roles')
      .select('username')
      .eq('user_id', newPcmId)
      .single();

    const pcmName = pcmData?.username || 'outro PCM';

    const { error } = await supabase
      .from('requisitions')
      .update({ 
        assigned_to: newPcmId,
        status: 'em_andamento', // Volta para em_andamento ao transferir
        transferred_from: user.id
      })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao transferir requisição",
        description: "Tente novamente",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Requisição transferida com sucesso",
      description: `Transferido para ${pcmName}. A requisição foi removida da sua lista.`,
    });
    setShowTransferDialog(false);
    navigate("/minhas-requisicoes");
  };

  if (!requisition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const isPCM = role === "pcm";
  const userId = user?.id || "";
  const isAssignedToMe = requisition.assigned_to === userId;
  const canTakeActions = isPCM && requisition.status !== "concluido" && requisition.status !== "rejeitado" && requisition.status !== "caducou" && requisition.status !== "encerrada_sem_liberacao";
  const canManageAssigned = isPCM && isAssignedToMe && (requisition.status === "em_andamento" || requisition.status === "pre_liberacao" || requisition.status === "coleta_emitida" || requisition.status === "material_disponivel");

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm pointer-events-auto">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="transition-all duration-200 hover:bg-accent pointer-events-auto">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Detalhes da Requisição</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        {/* Status & Priority */}
        <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <BadgeStatus status={requisition.status} />
              <BadgePriority priority={requisition.priority} />
            </div>
          </CardContent>
        </Card>

        {/* Equipment Info */}
        <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Equipamento e Item
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Área</Label>
                <p className="font-medium flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {requisition.area}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Equipamento</Label>
                <p className="font-medium mt-1">{requisition.equipment}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-muted-foreground">Item Solicitado</Label>
              <p className="font-medium mt-1">{requisition.item_description}</p>
              {requisition.item_code && ( // Display item code if available
                <p className="text-sm text-muted-foreground mt-1">Código: {requisition.item_code}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">Quantidade: {requisition.quantity}</p>
            </div>
          </CardContent>
        </Card>

        {/* Problem Description */}
        <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Descrição do Problema</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{requisition.problem_description}</p>
          </CardContent>
        </Card>

        {/* Justification */}
        {requisition.justification && (
          <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Justificativa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{requisition.justification}</p>
            </CardContent>
          </Card>
        )}

        {/* Cost Center */}
        {requisition.cost_center && (
          <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Centro de Custo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{requisition.cost_center}</p>
            </CardContent>
          </Card>
        )}

        {/* Photos */}
        {requisition.photos && requisition.photos.length > 0 && (
          <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Fotos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {requisition.photos.map((photo, index) => (
                  <div 
                    key={index} 
                    className="aspect-square rounded-lg overflow-hidden border animate-scale-in hover:scale-105 transition-transform duration-200 cursor-pointer"
                    onClick={() => setSelectedImage(photo)}
                  >
                    <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejection/Caducou Reason */}
        {requisition.rejection_reason && (requisition.status === "rejeitado" || requisition.status === "caducou") && (
          <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200 border-yellow-500/20">
            <CardHeader>
              <CardTitle className="text-yellow-600">
                {requisition.status === "rejeitado" ? "Motivo da Rejeição" : "Motivo do Caducamento"}
              </CardTitle>
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
            <p className="font-medium">{requisition.created_by}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(requisition.created_at).toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>

        {/* Transfer Info - Mostrar se foi transferida */}
        {transferredFromName && isAssignedToMe && (
          <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Users className="w-5 h-5" />
                <p className="font-medium">
                  Esta requisição foi transferida para você por <span className="font-bold">{transferredFromName}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions for PCM - Pending */}
        {canTakeActions && requisition.status === "pendente" && (
          <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="success"
                className="w-full transition-all duration-200 hover:scale-105" 
                onClick={handleTakeRequisition}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Assumir Requisição
              </Button>
              <Button
                variant="destructive"
                className="w-full transition-all duration-200 hover:scale-105"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actions for PCM - Assigned to Me */}
        {canManageAssigned && (
          <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Gerenciar Requisição</CardTitle>
              <CardDescription>Atualize o status conforme o andamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Atualizar Status</Label>
                <Select onValueChange={handleStatusChange} value={requisition.status}>
                  <SelectTrigger className="transition-all duration-200">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="pre_liberacao">Pré-Liberação</SelectItem>
                    <SelectItem value="coleta_emitida">Coleta Emitida</SelectItem>
                    <SelectItem value="material_disponivel">Material Disponível</SelectItem>
                    <SelectItem value="encerrada_sem_liberacao">Encerrada Sem Liberação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-3 border-t">
                <Button
                  variant="secondary"
                  className="w-full transition-all duration-200 hover:scale-105"
                  onClick={() => setShowTransferDialog(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Transferir para Outro PCM
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Requisição</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da rejeição. Esta informação será enviada ao solicitante.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Descreva o motivo da rejeição..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="transition-all duration-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200">
              Confirmar Rejeição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Caducou Dialog */}
      <AlertDialog open={showCaducouDialog} onOpenChange={setShowCaducouDialog}>
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como Caducou</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo do caducamento (pedido não liberado/não comprado). Esta informação será enviada ao solicitante.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Descreva o motivo do caducamento..."
              value={caducouReason}
              onChange={(e) => setCaducouReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="transition-all duration-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCaducou} className="bg-yellow-600 text-white hover:bg-yellow-700 transition-all duration-200">
              Confirmar Caducamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Dialog */}
      <TransferDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        onConfirm={handleTransfer}
        currentPcmId={userId}
      />

      {/* Image Modal */}
      <ImageModal
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
        imageUrl={selectedImage || ""}
        alt="Foto da requisição"
      />
    </div>
  );
};

export default RequisitionDetail;