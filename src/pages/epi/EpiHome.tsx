import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { HardHat, Plus, History, LogOut, Clock, Package } from "lucide-react";
import { EpiRequisition } from "@/types/epi";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EpiHome() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [requisitions, setRequisitions] = useState<EpiRequisition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchRequisitions = async () => {
      const { data } = await supabase
        .from('epi_requisitions')
        .select('*, epi_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) {
        setRequisitions(data as any);
      }
      setLoading(false);
    };

    fetchRequisitions();
    
    // Realtime subscription
    const channel = supabase
      .channel('epi_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'epi_requisitions' }, 
        () => fetchRequisitions()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel) };
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'aprovado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'entregue': return 'bg-green-100 text-green-800 border-green-200';
      case 'recusado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              <HardHat className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Rex EPI</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate('/'); }}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            size="lg" 
            className="h-24 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg"
            onClick={() => navigate('/epi/nova-requisicao')}
          >
            <Plus className="w-6 h-6 mr-2" />
            Solicitar Novo EPI
          </Button>
          
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="flex items-center justify-center h-24 text-muted-foreground">
              <span className="flex items-center">
                <History className="w-5 h-5 mr-2" />
                Histórico Completo
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Minhas Solicitações Recentes
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : requisitions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Você ainda não fez nenhuma solicitação de EPI.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {requisitions.map((req) => (
                <Card key={req.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        {req.epi_items?.image_url ? (
                          <img src={req.epi_items.image_url} alt="" className="w-12 h-12 rounded object-cover bg-muted" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base">{req.epi_items?.name || 'Item desconhecido'}</CardTitle>
                          <CardDescription>
                            Quantidade: {req.quantity} {req.epi_items?.unit}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className={`${getStatusColor(req.status)} border-0`}>
                        {req.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Solicitado em {format(new Date(req.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                      {req.rejection_reason && <span className="text-red-500">Motivo: {req.rejection_reason}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}