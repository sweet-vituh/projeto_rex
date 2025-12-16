import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Filter, LogOut, HardHat, RefreshCw, LayoutGrid } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const EpiInbox = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchRequisitions = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Requisitions
      const { data: reqData, error: reqError } = await supabase
        .from('epi_requisitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (reqError) throw reqError;

      // 2. Fetch Users to Map Names
      const userIds = [...new Set(reqData.map((item: any) => item.created_by))];
      let userMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from('user_roles')
          .select('user_id, username')
          .in('user_id', userIds);
          
        if (!userError && userData) {
          userData.forEach((u: any) => {
            userMap[u.user_id] = u.username;
          });
        }
      }
      
      const formattedData = reqData.map((item: any) => ({
        ...item,
        requester_name: userMap[item.created_by] || 'Usuário Desconhecido'
      }));

      setRequisitions(formattedData);
    } catch (error) {
      console.error("Erro ao buscar requisições:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
    
    const channel = supabase
      .channel('epi_inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'epi_requisitions' }, 
        () => fetchRequisitions()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const filteredRequisitions = requisitions.filter(req => {
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const matchesSearch = 
      req.item_name.toLowerCase().includes(search.toLowerCase()) ||
      req.requester_name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-orange-500">Rex EPI <span className="text-sm text-muted-foreground font-normal">Gestão</span></h1>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="hidden md:flex"
                onClick={() => navigate("/modules")}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Módulos
              </Button>
              <Button variant="outline" size="icon" onClick={fetchRequisitions}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="md:hidden mb-4">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full"
                onClick={() => navigate("/modules")}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Trocar Módulo
              </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por item ou solicitante..." 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_separacao">Em Separação</SelectItem>
                <SelectItem value="aguardando_retirada">Aguardando Retirada</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-3">
          {filteredRequisitions.map((req) => (
            <Card 
              key={req.id}
              className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-l-orange-500"
              onClick={() => navigate(`/epi/request/${req.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{req.item_name}</h3>
                    <p className="text-sm text-muted-foreground">Solicitado por: <span className="font-medium text-foreground">{req.requester_name}</span></p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    req.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                    req.status === 'concluido' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {req.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center text-sm">
                  <span>Qtd: {req.quantity} {req.size && `• Tam: ${req.size}`}</span>
                  <span className="text-muted-foreground text-xs">
                    {format(new Date(req.created_at), "dd/MM HH:mm")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredRequisitions.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              Nenhuma solicitação encontrada.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EpiInbox;