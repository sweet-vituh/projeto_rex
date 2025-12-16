import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeStatus } from "@/components/ui/badge-status";
import { HardHat, Calendar, ArrowLeft, RefreshCw } from "lucide-react";
import { EpiRequisition } from "@/types/epi";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshButton } from "@/components/RefreshButton";

export default function EpiHistory() {
  const [requisitions, setRequisitions] = useState<EpiRequisition[]>([]);
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
        .from("epi_requisitions")
        .select(`
          *,
          epi_item:epi_items (id, name, category, size)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData = data.map(req => ({
        ...req,
        epi_item: req.epi_item as EpiRequisition['epi_item'],
      }));

      setRequisitions(formattedData as EpiRequisition[]);
    } catch (error) {
      console.error("Erro ao buscar requisições de EPI:", error);
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

  const activeRequisitions = filterByStatus(["pendente", "aprovado"]);
  const completedRequisitions = filterByStatus(["entregue"]);
  const cancelledRequisitions = filterByStatus(["recusado"]);

  const EpiRequisitionCard = ({ req }: { req: EpiRequisition }) => (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 animate-fade-in"
      onClick={() => navigate(`/epi-requisition/${req.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-2">
              {req.epi_item?.name} ({req.quantity})
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <BadgeStatus status={req.status} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HardHat className="w-4 h-4" />
          <span>{req.epi_item?.category} {req.epi_item?.size ? `(${req.epi_item.size})` : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            Criada em {format(new Date(req.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/epi-home")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Histórico de EPIs</h1>
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/epi-home")} className="transition-all duration-200 hover:bg-accent">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Histórico de EPIs</h1>
              <p className="text-sm text-muted-foreground">Visualize todas as suas requisições de EPI</p>
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
            Entregues ({completedRequisitions.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Recusadas ({cancelledRequisitions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeRequisitions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma requisição de EPI ativa
              </CardContent>
            </Card>
          ) : (
            activeRequisitions.map((req) => <EpiRequisitionCard key={req.id} req={req} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedRequisitions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma requisição de EPI entregue
              </CardContent>
            </Card>
          ) : (
            completedRequisitions.map((req) => <EpiRequisitionCard key={req.id} req={req} />)
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledRequisitions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma requisição de EPI recusada
              </CardContent>
            </Card>
          ) : (
            cancelledRequisitions.map((req) => <EpiRequisitionCard key={req.id} req={req} />)
          )}
        </TabsContent>
      </Tabs>
      </main>
    </div>
  );
}