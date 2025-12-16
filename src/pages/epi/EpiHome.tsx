import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, History, LogOut, HardHat, Shirt, Footprints, Glasses, Ear, LayoutGrid } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const EpiHome = () => {
  const navigate = useNavigate();
  const { user, username, signOut } = useAuth();
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchRequisitions = async () => {
      try {
        const { data, error } = await supabase
          .from('epi_requisitions')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRequisitions(data || []);
      } catch (error) {
        console.error("Erro ao buscar requisições:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequisitions();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('epi_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'epi_requisitions', filter: `created_by=eq.${user.id}` }, 
        () => fetchRequisitions()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pendente: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900",
      em_separacao: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900",
      aguardando_retirada: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-900",
      concluido: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900",
      rejeitado: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900",
    };
    
    const labels: Record<string, string> = {
      pendente: "Pendente",
      em_separacao: "Em Separação",
      aguardando_retirada: "Aguardando Retirada",
      concluido: "Concluído",
      rejeitado: "Rejeitado",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pendente}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getItemIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'calçado': return <Footprints className="w-5 h-5 text-orange-500" />;
      case 'uniforme': return <Shirt className="w-5 h-5 text-blue-500" />;
      case 'óculos': return <Glasses className="w-5 h-5 text-cyan-500" />;
      case 'protetor auricular': return <Ear className="w-5 h-5 text-pink-500" />;
      default: return <HardHat className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-500 cursor-pointer" onClick={() => navigate("/epi/home")}>Rex EPI</h1>
            <p className="text-sm text-muted-foreground">Olá, {username || "Colaborador"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/modules")} className="hidden md:flex">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Módulos
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Mobile Module Button */}
        <div className="md:hidden">
          <Button variant="outline" className="w-full" onClick={() => navigate("/modules")}>
            <LayoutGrid className="w-4 h-4 mr-2" />
            Trocar Módulo
          </Button>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full h-20 text-lg font-semibold bg-orange-500 hover:bg-orange-600 shadow-lg transition-all duration-200 hover:scale-105 animate-fade-in"
            onClick={() => navigate("/epi/new")}
          >
            <Plus className="w-6 h-6 mr-2" />
            Solicitar EPI
          </Button>
        </div>

        {/* History Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Minhas Solicitações</h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : requisitions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <HardHat className="w-12 h-12 mx-auto mb-4 opacity-50" />
                Nenhuma solicitação de EPI encontrada.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {requisitions.map((req) => (
                <Card
                  key={req.id}
                  className="hover:shadow-md transition-all duration-200 animate-fade-in cursor-pointer border-l-4 border-l-orange-500"
                  onClick={() => navigate(`/epi/request/${req.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {getItemIcon(req.item_type)}
                        <div>
                          <h3 className="font-semibold text-base">{req.item_name}</h3>
                          <p className="text-xs text-muted-foreground">{req.item_type} {req.size && `• Tamanho: ${req.size}`}</p>
                        </div>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div className="text-sm text-muted-foreground">
                        Qtd: {req.quantity}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(req.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
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
};

export default EpiHome;