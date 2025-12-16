import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Calendar, Ruler, PackageCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const EpiRequisitionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [requisition, setRequisition] = useState<any>(null);
  const [requesterName, setRequesterName] = useState("");

  const isPCM = role === "pcm";

  useEffect(() => {
    const fetchDetail = async () => {
      const { data, error } = await supabase
        .from('epi_requisitions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        toast({ title: "Erro", description: "Requisição não encontrada", variant: "destructive" });
        navigate(-1);
        return;
      }
      setRequisition(data);

      // Fetch requester name
      const { data: userData } = await supabase
        .from('user_roles')
        .select('username')
        .eq('user_id', data.created_by)
        .single();
      
      if (userData) setRequesterName(userData.username);
    };

    fetchDetail();
  }, [id, navigate, toast]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('epi_requisitions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setRequisition(prev => ({ ...prev, status: newStatus }));
      toast({ title: "Status atualizado!" });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao atualizar status", variant: "destructive" });
    }
  };

  if (!requisition) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Detalhes do EPI</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <Card className="border-l-4 border-l-orange-500 shadow-md">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl text-orange-600">{requisition.item_name}</CardTitle>
                <p className="text-muted-foreground">{requisition.item_type}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded bg-secondary font-mono font-bold">
                  Qtd: {requisition.quantity}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Ruler className="w-4 h-4" /> Tamanho
                </Label>
                <p className="font-medium">{requisition.size || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <PackageCheck className="w-4 h-4" /> Motivo
                </Label>
                <p className="font-medium">{requisition.justification}</p>
              </div>
            </div>

            <div className="pt-4 border-t grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" /> Solicitante
                </Label>
                <p className="font-medium">{requesterName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Data
                </Label>
                <p className="font-medium">
                  {format(new Date(requisition.created_at), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            </div>

            {isPCM && (
              <div className="pt-6 border-t space-y-3">
                <Label className="text-lg font-semibold">Gerenciar Status</Label>
                <Select value={requisition.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_separacao">Em Separação</SelectItem>
                    <SelectItem value="aguardando_retirada">Aguardando Retirada</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isPCM && (
               <div className="pt-4 border-t">
                  <Label className="text-muted-foreground">Status Atual</Label>
                  <div className="mt-1 p-3 bg-secondary rounded text-center font-bold uppercase tracking-wider">
                    {requisition.status.replace('_', ' ')}
                  </div>
               </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EpiRequisitionDetail;