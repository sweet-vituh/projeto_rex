import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { HardHat, LogOut, CheckCircle2, XCircle, Clock, AlertTriangle, PackageCheck } from "lucide-react";
import { EpiRequisition, EpiItem } from "@/types/epi";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { Input } from "@/components/ui/input";

export default function SafetyDashboard() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [requisitions, setRequisitions] = useState<EpiRequisition[]>([]);
  const [stockItems, setStockItems] = useState<EpiItem[]>([]);
  const [selectedReq, setSelectedReq] = useState<EpiRequisition | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'deliver' | null>(null);

  const fetchData = async () => {
    // Fetch pending requisitions
    const { data: reqs } = await supabase
      .from('epi_requisitions')
      .select('*, epi_items(*), user_roles(username)')
      .order('created_at', { ascending: false });
    
    if (reqs) setRequisitions(reqs as any);

    // Fetch stock for dashboard
    const { data: items } = await supabase
      .from('epi_items')
      .select('*')
      .eq('is_active', true);
    
    if (items) setStockItems(items as EpiItem[]);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('safety_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'epi_requisitions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'epi_items' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel) };
  }, []);

  const handleAction = async () => {
    if (!selectedReq || !actionType || !user) return;

    try {
      let updateData: any = {};
      
      if (actionType === 'approve') {
        updateData = { status: 'aprovado', approved_by: user.id };
      } else if (actionType === 'reject') {
        updateData = { status: 'recusado', rejection_reason: rejectReason, approved_by: user.id };
      } else if (actionType === 'deliver') {
        updateData = { status: 'entregue', delivered_at: new Date().toISOString() };
        
        // Decrement stock
        await supabase.rpc('decrement_epi_stock', { 
           item_id: selectedReq.epi_item_id, 
           qty: selectedReq.quantity 
        }); // Note: need to implement this RPC or do it manually
        
        // Manual decrement for now (simpler than RPC for this demo)
        const currentItem = stockItems.find(i => i.id === selectedReq.epi_item_id);
        if (currentItem) {
             await supabase.from('epi_items')
                .update({ current_stock: currentItem.current_stock - selectedReq.quantity })
                .eq('id', currentItem.id);
             
             // Log movement
             await supabase.from('epi_stock_movements').insert({
                 epi_item_id: currentItem.id,
                 user_id: user.id,
                 quantity: -selectedReq.quantity,
                 movement_type: 'saida_requisicao',
                 notes: `Requisição ${selectedReq.id}`
             });
        }
      }

      const { error } = await supabase
        .from('epi_requisitions')
        .update(updateData)
        .eq('id', selectedReq.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Requisição atualizada." });
      setActionType(null);
      setSelectedReq(null);
      setRejectReason("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const pendingReqs = requisitions.filter(r => r.status === 'pendente');
  const approvedReqs = requisitions.filter(r => r.status === 'aprovado');
  const lowStockItems = stockItems.filter(i => i.current_stock <= i.min_stock);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardHat className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold">Segurança do Trabalho</h1>
              <p className="text-xs text-muted-foreground">Painel de Controle de EPIs</p>
            </div>
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
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-blue-600">{pendingReqs.length}</span>
              <span className="text-sm text-muted-foreground text-center">Pendentes</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-green-600">{approvedReqs.length}</span>
              <span className="text-sm text-muted-foreground text-center">Aguard. Entrega</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
               <span className={`text-3xl font-bold ${lowStockItems.length > 0 ? 'text-red-500' : 'text-gray-600'}`}>
                 {lowStockItems.length}
               </span>
               <span className="text-sm text-muted-foreground text-center">Estoque Baixo</span>
            </CardContent>
          </Card>
          <Card>
             <CardContent className="p-4 flex flex-col items-center justify-center">
               <span className="text-3xl font-bold">{stockItems.length}</span>
               <span className="text-sm text-muted-foreground text-center">Tipos de EPI</span>
             </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pendentes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pendentes">Pendentes ({pendingReqs.length})</TabsTrigger>
            <TabsTrigger value="aprovadas">Aguardando Entrega ({approvedReqs.length})</TabsTrigger>
            <TabsTrigger value="estoque">Alerta Estoque ({lowStockItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes" className="space-y-4 mt-4">
            {pendingReqs.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhuma pendência.</p> : 
             pendingReqs.map(req => (
              <Card key={req.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{req.user_roles?.username || 'Usuário'}</Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(req.created_at), "dd/MM HH:mm")}</span>
                      </div>
                      <h3 className="font-semibold text-lg">{req.epi_items?.name}</h3>
                      <p className="text-sm text-muted-foreground">Qtd: {req.quantity} {req.epi_items?.unit}</p>
                      {req.justification && <p className="text-sm mt-2 bg-muted p-2 rounded">"{req.justification}"</p>}
                    </div>
                    <div className="flex gap-2 items-center">
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700"
                        onClick={() => { setSelectedReq(req); setActionType('reject'); }}
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Recusar
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => { setSelectedReq(req); setActionType('approve'); }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Aprovar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="aprovadas" className="space-y-4 mt-4">
             {approvedReqs.map(req => (
              <Card key={req.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{req.epi_items?.name} ({req.quantity})</h3>
                    <p className="text-sm text-muted-foreground">Solicitante: {req.user_roles?.username}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => { setSelectedReq(req); setActionType('deliver'); }}>
                    <PackageCheck className="w-4 h-4 mr-2" />
                    Marcar Entregue
                  </Button>
                </CardContent>
              </Card>
             ))}
          </TabsContent>

          <TabsContent value="estoque" className="space-y-4 mt-4">
            {lowStockItems.map(item => (
              <Card key={item.id} className="border-red-200 bg-red-50 dark:bg-red-900/10">
                <CardContent className="p-4 flex items-center gap-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <div>
                    <h3 className="font-bold text-red-700 dark:text-red-400">{item.name}</h3>
                    <p className="text-sm">Estoque Atual: <b>{item.current_stock}</b> (Mínimo: {item.min_stock})</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>

      {/* Confirmation Dialogs */}
      <AlertDialog open={!!selectedReq} onOpenChange={() => { setSelectedReq(null); setActionType(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Aprovar Solicitação' : 
               actionType === 'reject' ? 'Recusar Solicitação' : 
               'Confirmar Entrega'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' ? `Confirma a aprovação de ${selectedReq?.quantity}x ${selectedReq?.epi_items?.name}?` :
               actionType === 'reject' ? 'Por favor, informe o motivo da recusa.' :
               'Confirma que o material foi entregue ao solicitante? O estoque será atualizado.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {actionType === 'reject' && (
            <Input 
              placeholder="Motivo da recusa..." 
              value={rejectReason} 
              onChange={e => setRejectReason(e.target.value)} 
            />
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAction}
              className={actionType === 'reject' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary'}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}