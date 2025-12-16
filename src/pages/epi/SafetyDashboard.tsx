import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  LogOut, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Plus,
  Box
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SafetyDashboard = () => {
  const navigate = useNavigate();
  const { user, username, signOut } = useAuth();
  const { toast } = useToast();
  
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Requisitions
      const { data: reqData, error: reqError } = await supabase
        .from('epi_requisitions')
        .select(`
          *,
          user_roles (username)
        `)
        .order('created_at', { ascending: false });

      if (reqError) throw reqError;
      
      const formattedReqs = reqData.map((r: any) => ({
        ...r,
        requester_name: r.user_roles?.username || 'Desconhecido'
      }));
      setRequisitions(formattedReqs);

      // Fetch Stock
      const { data: stockData, error: stockError } = await supabase
        .from('epi_stock')
        .select('*')
        .order('item_name');

      if (stockError) throw stockError;
      setStockItems(stockData);

    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('safety_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'epi_requisitions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'epi_stock' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const updateStatus = async (id: string, newStatus: string, quantity: number, itemId: string | null) => {
    try {
      const { error } = await supabase
        .from('epi_requisitions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({ title: `Status atualizado para ${newStatus.replace('_', ' ')}` });
      fetchData();
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  // KPIs
  const pendingCount = requisitions.filter(r => r.status === 'pendente').length;
  const lowStockCount = stockItems.filter(i => i.current_quantity <= i.min_quantity).length;
  const deliveredToday = requisitions.filter(r => 
    r.status === 'concluido' && 
    new Date(r.updated_at).toDateString() === new Date().toDateString()
  ).length;

  const filteredRequisitions = requisitions.filter(r => 
    filterStatus === 'all' ? true : r.status === filterStatus
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">Painel Téc. Segurança</h1>
            <p className="text-sm text-muted-foreground">Bem-vindo, {username}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/modules")} className="hidden md:flex">
              <Plus className="w-4 h-4 mr-2" /> Fazer Requisição
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        
        {/* Mobile Action Button */}
        <div className="md:hidden">
          <Button className="w-full" onClick={() => navigate("/modules")}>
            <Plus className="w-4 h-4 mr-2" /> Fazer Requisição
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <h3 className="text-2xl font-bold">{pendingCount}</h3>
              </div>
              <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estoque Baixo</p>
                <h3 className="text-2xl font-bold">{lowStockCount}</h3>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500 opacity-50" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entregues Hoje</p>
                <h3 className="text-2xl font-bold">{deliveredToday}</h3>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requisitions" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="requisitions">Requisições</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
          </TabsList>

          {/* Requisitions Tab */}
          <TabsContent value="requisitions" className="space-y-4">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <Button 
                variant={filterStatus === 'all' ? 'default' : 'outline'} 
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                Todos
              </Button>
              <Button 
                variant={filterStatus === 'pendente' ? 'default' : 'outline'} 
                onClick={() => setFilterStatus('pendente')}
                size="sm"
                className={filterStatus === 'pendente' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
              >
                Pendentes
              </Button>
              <Button 
                variant={filterStatus === 'em_separacao' ? 'default' : 'outline'} 
                onClick={() => setFilterStatus('em_separacao')}
                size="sm"
                className={filterStatus === 'em_separacao' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                Em Separação
              </Button>
              <Button 
                variant={filterStatus === 'concluido' ? 'default' : 'outline'} 
                onClick={() => setFilterStatus('concluido')}
                size="sm"
                className={filterStatus === 'concluido' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Concluídos
              </Button>
            </div>

            <div className="grid gap-3">
              {filteredRequisitions.map(req => (
                <Card key={req.id} className="animate-fade-in hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{req.item_type}</Badge>
                          <span className="text-xs text-muted-foreground">{format(new Date(req.created_at), "dd/MM HH:mm")}</span>
                        </div>
                        <h4 className="font-bold text-lg">{req.item_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Solicitante: <span className="text-foreground font-medium">{req.requester_name}</span> • 
                          Qtd: {req.quantity} {req.size && `• Tam: ${req.size}`}
                        </p>
                        <p className="text-sm mt-1 bg-muted/50 p-2 rounded inline-block">
                          Motivo: {req.justification}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 min-w-[140px]">
                        {req.status === 'pendente' && (
                          <>
                            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => updateStatus(req.id, 'em_separacao', req.quantity, null)}>
                              Iniciar Separação
                            </Button>
                            <Button size="sm" variant="destructive" className="w-full" onClick={() => updateStatus(req.id, 'rejeitado', 0, null)}>
                              Recusar
                            </Button>
                          </>
                        )}
                        {req.status === 'em_separacao' && (
                          <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => updateStatus(req.id, 'aguardando_retirada', req.quantity, null)}>
                            Pronto p/ Retirada
                          </Button>
                        )}
                        {req.status === 'aguardando_retirada' && (
                          <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={() => updateStatus(req.id, 'concluido', req.quantity, null)}>
                            Confirmar Entrega
                          </Button>
                        )}
                        {['concluido', 'rejeitado'].includes(req.status) && (
                          <div className={`text-center font-bold text-sm uppercase p-2 rounded ${req.status === 'concluido' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                            {req.status}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredRequisitions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">Nenhuma requisição encontrada.</div>
              )}
            </div>
          </TabsContent>

          {/* Stock Tab */}
          <TabsContent value="stock">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Estoque Atual</CardTitle>
                <Button size="sm" onClick={() => toast({ title: "Funcionalidade em desenvolvimento", description: "A adição de itens será implementada na próxima etapa." })}>
                  <Plus className="w-4 h-4 mr-2" /> Novo Item
                </Button>
              </CardHeader>
              <CardContent>
                {stockItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Box className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    Estoque vazio. Adicione itens.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stockItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div>
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-xs text-muted-foreground">{item.item_type} {item.size && `• ${item.size}`}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${item.current_quantity <= item.min_quantity ? 'text-red-500' : 'text-green-600'}`}>
                            {item.current_quantity}
                          </p>
                          <p className="text-xs text-muted-foreground">unidades</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SafetyDashboard;