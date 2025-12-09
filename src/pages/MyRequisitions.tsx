import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgePriority } from "@/components/ui/badge-priority";
import { BadgeStatus } from "@/components/ui/badge-status";
import { ArrowLeft, Clock } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RefreshButton } from "@/components/RefreshButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Requisition } from "@/types/requisition";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MyRequisitions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myRequisitions, setMyRequisitions] = useState<Requisition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchRequisitions = async () => {
      try {
        // Buscar requisições atribuídas ao PCM atual
        const { data, error } = await supabase
          .from('requisitions')
          .select('*')
          .eq('assigned_to', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setMyRequisitions(data as Requisition[]);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchRequisitions();

    // Subscrever a mudanças em tempo real
    const channel = supabase
      .channel('my_requisitions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requisitions',
        },
        () => {
          fetchRequisitions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/inbox")} 
              className="transition-all duration-200 hover:bg-accent"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Minhas Requisições</h1>
              <p className="text-sm text-muted-foreground">
                {myRequisitions.length} {myRequisitions.length === 1 ? "requisição assumida" : "requisições assumidas"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton onClick={() => { setIsRefreshing(true); setIsLoading(true); }} isRefreshing={isRefreshing} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {myRequisitions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Você ainda não assumiu nenhuma requisição
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myRequisitions.map((req) => (
              <Card
                key={req.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 animate-fade-in hover-scale"
                onClick={() => navigate(`/requisicao/${req.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{req.equipment}</CardTitle>
                      </div>
                      <CardDescription className="line-clamp-1">
                        {req.item_description}
                      </CardDescription>
                    </div>
                    <BadgePriority priority={req.priority} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {req.problem_description}
                  </p>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <BadgeStatus status={req.status} />
                      <span className="text-xs text-muted-foreground">{req.area}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(req.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyRequisitions;
