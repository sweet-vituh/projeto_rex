import { useCallback, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, History, LogOut, Clock, Pencil, Trash2, HardHat } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RexLogo } from "@/components/RexLogo";
import { BadgeStatus } from "@/components/ui/badge-status";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { RefreshButton } from "@/components/RefreshButton";
import { Skeleton } from "@/components/ui/skeleton";
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
import { EpiRequisition, EpiStatus } from "@/types/epi";
import { toast as sonnerToast } from "sonner";

const EpiHome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, username: authUsername, signOut, role } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requisitionToDelete, setRequisitionToDelete] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [epiRequisitions, setEpiRequisitions] = useState<EpiRequisition[]>([]);
  const [isLoadingEpi, setIsLoadingEpi] = useState(true);

  const previousEpiRequisitionsRef = useRef<EpiRequisition[]>([]);

  const fetchEpiRequisitions = useCallback(async () => {
    if (!user) return;
    setIsLoadingEpi(true);
    try {
      let query = supabase
        .from('epi_requisitions')
        .select(`
          *,
          epi_item:epi_items (id, name, category, size),
          requester_username:user_roles (username)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const formattedData = data.map(req => ({
        ...req,
        epi_item: req.epi_item as EpiRequisition['epi_item'],
        requester_username: (req.requester_username as { username: string } | null)?.username || 'Usuário Desconhecido',
      }));
      setEpiRequisitions(formattedData);
    } catch (error) {
      console.error("Error fetching EPI requisitions:", error);
      toast({
        title: "Erro ao carregar requisições de EPI",
        description: "Não foi possível carregar suas requisições de EPI.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEpi(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchEpiRequisitions();

    const channel = supabase
      .channel('realtime_epi_requisitions_user')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'epi_requisitions',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Re-fetch to get joined data
            fetchEpiRequisitions();
          } else if (payload.eventType === 'UPDATE') {
            // Re-fetch to get joined data
            fetchEpiRequisitions();
          } else if (payload.eventType === 'DELETE') {
            setEpiRequisitions(prev => prev.filter(req => req.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchEpiRequisitions]);

  useEffect(() => {
    if (isLoadingEpi || !user) return;

    const previousRequisitions = previousEpiRequisitionsRef.current;

    epiRequisitions.forEach(currentReq => {
      const previousReq = previousRequisitions.find(pReq => pReq.id === currentReq.id);

      if (previousReq && previousReq.status !== currentReq.status) {
        if (currentReq.user_id === user.id) {
          if (currentReq.status === "aprovado") {
            sonnerToast.success(`Requisição de EPI Aprovada!`, {
              description: `Seu pedido para "${currentReq.epi_item?.name}" foi aprovado.`,
              duration: 8000,
              action: {
                label: "Ver",
                onClick: () => navigate(`/epi-requisition/${currentReq.id}`),
              },
            });
          } else if (currentReq.status === "recusado") {
            sonnerToast.error(`Requisição de EPI Recusada`, {
              description: `Seu pedido para "${currentReq.epi_item?.name}" foi recusado.`,
              duration: 8000,
              action: {
                label: "Ver",
                onClick: () => navigate(`/epi-requisition/${currentReq.id}`),
              },
            });
          } else if (currentReq.status === "entregue") {
            sonnerToast.info(`EPI Entregue`, {
              description: `Seu pedido para "${currentReq.epi_item?.name}" foi marcado como entregue.`,
              duration: 8000,
              action: {
                label: "Ver",
                onClick: () => navigate(`/epi-requisition/${currentReq.id}`),
              },
            });
          }
        }
      }
    });

    previousEpiRequisitionsRef.current = epiRequisitions;
  }, [epiRequisitions, isLoadingEpi, user, navigate]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchEpiRequisitions();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [fetchEpiRequisitions]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  const handleDelete = async () => {
    if (!requisitionToDelete) return;

    const { error } = await supabase
      .from('epi_requisitions')
      .delete()
      .eq('id', requisitionToDelete);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a requisição de EPI",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Requisição de EPI excluída",
        description: "A requisição foi removida com sucesso",
      });
    }

    setDeleteDialogOpen(false);
    setRequisitionToDelete(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <RexLogo />
            <p className="text-sm text-muted-foreground">Olá, {authUsername || "Usuário"}</p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton onClick={handleRefresh} isRefreshing={isRefreshing} />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full h-20 text-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105 animate-fade-in"
            onClick={() => navigate("/new-epi-requisition")}
          >
            <Plus className="w-6 h-6 mr-2" />
            Nova Requisição de EPI
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full h-16 text-base font-semibold transition-all duration-200 hover:scale-105 animate-fade-in"
            onClick={() => navigate("/epi-history")}
          >
            <History className="w-5 h-5 mr-2" />
            Ver Histórico de EPIs
          </Button>
          {role === "tecnico_seguranca" && (
            <Button
              size="lg"
              variant="secondary"
              className="w-full h-16 text-base font-semibold transition-all duration-200 hover:scale-105 animate-fade-in"
              onClick={() => navigate("/security-dashboard")}
            >
              <HardHat className="w-5 h-5 mr-2" />
              Painel Téc. Segurança
            </Button>
          )}
        </div>

        {/* History Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Minhas Requisições de EPI</h2>
          </div>

          {isLoadingEpi ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : epiRequisitions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma requisição de EPI ainda. Crie sua primeira!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {epiRequisitions.map((req) => (
                <Card
                  key={req.id}
                  className="hover:shadow-md transition-all duration-200 animate-fade-in hover-scale"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/epi-requisition/${req.id}`)}
                      >
                        <CardTitle className="text-base truncate">
                          {req.epi_item?.name} ({req.quantity})
                        </CardTitle>
                        <CardDescription className="truncate">
                          {req.epi_item?.category} {req.epi_item?.size ? `(${req.epi_item.size})` : ''}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <BadgeStatus status={req.status} />
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeTime(req.created_at)}</span>
                      </div>
                    </div>
                    {req.status === "pendente" && (
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRequisitionToDelete(req.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Requisição de EPI</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta requisição de EPI? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="transition-all duration-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EpiHome;