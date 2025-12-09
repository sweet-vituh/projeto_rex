import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeStatus } from "@/components/ui/badge-status";
import { BadgePriority } from "@/components/ui/badge-priority";
import { Clock, Package, Calendar, ArrowLeft, RefreshCw } from "lucide-react";
import { Requisition } from "@/types/requisition";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshButton } from "@/components/RefreshButton";

export default function History() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetchRequisitions();
  }, [user]);

  const fetchRequisitions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("requisitions")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const requisitionsWithCreator = data.map((req) => ({
        ...req,
        created_by: "Você",
        code: req.item_code,
        photos: req.photos || [],
      }));

      setRequisitions(requisitionsWithCreator as Requisition[]);
    } catch (error) {
      console.error("Erro ao buscar requisições:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setLoading(true);
    fetchRequisitions().finally(() => setIsRefreshing(false));
  };

  const filterByStatus = (status: string[]) => {
    return requisitions.filter((req) => status.includes(req.status));
  };

  const activeRequisitions = filterByStatus(["pendente", "em_andamento", "pre_liberacao", "coleta_emitida", "material_disponivel"]);
  const completedRequisitions = filterByStatus(["concluido"]);
  const cancelledRequisitions = filterByStatus(["rejeitado", "caducou", "encerrada_sem_liberacao"]);

  const RequisitionCard = ({ req }: { req: Requisition }) => (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 animate-fade-in"
      onClick={() => navigate(`/requisicao/${req.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-2">
              {req.item_description}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <BadgeStatus status={req.status} />
              <BadgePriority priority={req.priority} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="w-4 h-4" />
          <span>{req.equipment}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            Criada em {format(new Date(req.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
        {req.code && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Código: {req.code}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Histórico de Requisições</h1>
                <p className="text-sm text-muted-foreground">Carregando...</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="container mx-auto p-4 md:p-6 max-w-6xl space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/home")} className="transition-all duration-200 hover:bg-accent">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Histórico de Requisições</h1>
              <p className="text-sm text-muted-foreground">Visualize todas as suas requisições</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton onClick={handleRefresh} isRefreshing={isRefreshing} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 max-w-6xl">

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="active">
            Ativas ({activeRequisitions.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídas ({completedRequisitions.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Canceladas ({cancelledRequisitions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeRequisitions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma requisição ativa
              </CardContent>
            </Card>
          ) : (
            activeRequisitions.map((req) => <RequisitionCard key={req.id} req={req} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedRequisitions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma requisição concluída
              </CardContent>
            </Card>
          ) : (
            completedRequisitions.map((req) => <RequisitionCard key={req.id} req={req} />)
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledRequisitions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma requisição cancelada
              </CardContent>
            </Card>
          ) : (
            cancelledRequisitions.map((req) => <RequisitionCard key={req.id} req={req} />)
          )}
        </TabsContent>
      </Tabs>
      </main>
    </div>
  );
}
