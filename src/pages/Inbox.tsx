import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BadgePriority } from "@/components/ui/badge-priority";
import { BadgeStatus } from "@/components/ui/badge-status";
import { LogOut, Search, Filter, Clock, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RexLogo } from "@/components/RexLogo";
import { RefreshButton } from "@/components/RefreshButton";
import { Priority, Status } from "@/types/requisition";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeRequisitions } from "@/hooks/use-realtime-requisitions";
import { Skeleton } from "@/components/ui/skeleton";

const Inbox = () => {
  const navigate = useNavigate();
  const { username: authUsername, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterArea, setFilterArea] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { requisitions, isLoading, refresh } = useRealtimeRequisitions({});

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refresh]);

  const filteredRequisitions = requisitions.filter((req) => {
    let matches = true;
    
    if (searchTerm) {
      matches = matches && (
        req.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.item_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.area.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPriority !== "all") {
      matches = matches && req.priority === filterPriority;
    }

    if (filterStatus !== "all") {
      matches = matches && req.status === filterStatus;
    }

    if (filterArea !== "all") {
      matches = matches && req.area === filterArea;
    }

    return matches;
  });

  const newCount = requisitions.filter(r => r.status === 'pendente').length;
  const areas = ["all", ...Array.from(new Set(requisitions.map((r) => r.area)))];

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

    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <RexLogo />
              <p className="text-sm text-muted-foreground">PCM - {authUsername || "PCM"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate("/minhas-requisicoes")}
                className="transition-all duration-200 hover:scale-105"
              >
                Minhas Requisições
              </Button>
              <RefreshButton onClick={handleRefresh} isRefreshing={isRefreshing} />
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por equipamento, item ou área..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as Status | "all")}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  <SelectItem value="caducou">Caducou</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as Priority | "all")}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area === "all" ? "Todas Áreas" : area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-primary" />
          <span className="font-semibold">
            {newCount} {newCount === 1 ? "nova requisição" : "novas requisições"}
          </span>
        </div>

        {/* Requisitions List */}
        {filteredRequisitions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma requisição encontrada com os filtros aplicados
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
              {filteredRequisitions.map((req) => (
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
                        {req.status === "pendente" && (
                          <Badge variant="secondary" className="h-5 px-1.5">Novo</Badge>
                        )}
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

export default Inbox;
