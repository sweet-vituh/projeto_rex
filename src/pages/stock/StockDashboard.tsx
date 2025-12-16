import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  LogOut, 
  Package, 
  AlertTriangle, 
  Search, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  History,
  Box,
  Plus,
  LayoutGrid
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const StockDashboard = () => {
  const navigate = useNavigate();
  const { user, username, signOut } = useAuth();
  const { toast } = useToast();
  
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [movementType, setMovementType] = useState<"ENTRY" | "EXIT">("ENTRY");
  const [movementQty, setMovementQty] = useState("");
  const [movementReason, setMovementReason] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Stock
      const { data: stockData, error: stockError } = await supabase
        .from('epi_stock')
        .select('*')
        .order('item_name');

      if (stockError) throw stockError;
      setStockItems(stockData || []);

      // Fetch Recent Movements
      const { data: moveData, error: moveError } = await supabase
        .from('epi_stock_movements')
        .select(`
          *,
          epi_stock (item_name, item_type),
          user_roles (username)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (moveError) throw moveError;
      
      const formattedMovements = moveData.map((m: any) => ({
        ...m,
        item_name: m.epi_stock?.item_name || 'Item Removido',
        username: m.user_roles?.username || 'Usuário'
      }));
      setMovements(formattedMovements);

    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const openMovementModal = (item: any, type: "ENTRY" | "EXIT") => {
    setSelectedItem(item);
    setMovementType(type);
    setMovementQty("");
    setMovementReason("");
    setMovementModalOpen(true);
  };

  const handleMovementSubmit = async () => {
    if (!selectedItem || !movementQty || parseInt(movementQty) <= 0 || !movementReason) {
      toast({ title: "Preencha todos os campos corretamente", variant: "destructive" });
      return;
    }

    const qty = parseInt(movementQty);
    const newQuantity = movementType === "ENTRY" 
      ? selectedItem.current_quantity + qty 
      : selectedItem.current_quantity - qty;

    if (newQuantity < 0) {
      toast({ title: "Estoque insuficiente para esta saída", variant: "destructive" });
      return;
    }

    try {
      // 1. Register movement
      const { error: moveError } = await supabase
        .from('epi_stock_movements')
        .insert({
          stock_item_id: selectedItem.id,
          user_id: user?.id,
          movement_type: movementType,
          quantity: qty,
          reason: movementReason
        });

      if (moveError) throw moveError;

      // 2. Update stock quantity
      const { error: stockError } = await supabase
        .from('epi_stock')
        .update({ current_quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', selectedItem.id);

      if (stockError) throw stockError;

      toast({ title: "Movimentação registrada com sucesso!" });
      setMovementModalOpen(false);
      fetchData();

    } catch (error: any) {
      toast({ title: "Erro ao registrar", description: error.message, variant: "destructive" });
    }
  };

  const filteredStock = stockItems.filter(item => 
    item.item_name.toLowerCase().includes(search.toLowerCase()) ||
    item.item_type.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = stockItems.filter(i => i.current_quantity <= i.min_quantity);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Almoxarifado</h1>
            <p className="text-sm text-muted-foreground">Gestão de Estoque - {username}</p>
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
        {/* Mobile Action Button */}
        <div className="md:hidden">
          <Button variant="outline" className="w-full" onClick={() => navigate("/modules")}>
            <LayoutGrid className="w-4 h-4 mr-2" />
            Trocar Módulo
          </Button>
        </div>

        {/* Alerts */}
        {lowStockItems.length > 0 && (
          <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/10">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-700 dark:text-red-400">Atenção: Estoque Baixo</h3>
                <p className="text-sm text-red-600/80 dark:text-red-400/80">
                  {lowStockItems.length} itens estão abaixo do nível mínimo. Verifique a lista.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stock List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Package className="w-5 h-5" /> Inventário
              </h2>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar item..." 
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3">
              {filteredStock.map(item => (
                <Card key={item.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{item.item_name}</h3>
                        {item.current_quantity <= item.min_quantity && (
                          <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Baixo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.item_type} {item.size && `• Tam: ${item.size}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Mínimo: {item.min_quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center mr-2">
                        <span className={`text-2xl font-bold ${item.current_quantity <= item.min_quantity ? 'text-red-500' : 'text-foreground'}`}>
                          {item.current_quantity}
                        </span>
                        <p className="text-[10px] uppercase text-muted-foreground">Atual</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => openMovementModal(item, "ENTRY")}>
                          <ArrowUpCircle className="w-4 h-4 mr-1" /> Entrada
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => openMovementModal(item, "EXIT")}>
                          <ArrowDownCircle className="w-4 h-4 mr-1" /> Saída
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredStock.length === 0 && (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  <Box className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  Nenhum item encontrado no estoque.
                </div>
              )}
            </div>
          </div>

          {/* Recent Movements History */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <History className="w-5 h-5" /> Histórico Recente
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {movements.map(move => (
                    <div key={move.id} className="p-3 flex items-start gap-3">
                      <div className={`mt-1 p-1.5 rounded-full ${move.movement_type === 'ENTRY' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {move.movement_type === 'ENTRY' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{move.item_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {move.movement_type === 'ENTRY' ? 'Entrada' : 'Saída'} de <strong>{move.quantity}</strong> • {move.username}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 italic truncate">
                          "{move.reason}"
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(move.created_at), "dd/MM HH:mm")}
                      </span>
                    </div>
                  ))}
                  {movements.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhuma movimentação recente.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Movement Modal */}
      <Dialog open={movementModalOpen} onOpenChange={setMovementModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar {movementType === "ENTRY" ? "Entrada" : "Saída"}</DialogTitle>
            <DialogDescription>
              {selectedItem?.item_name} {selectedItem?.size && `(Tam: ${selectedItem.size})`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input 
                type="number" 
                min="1" 
                value={movementQty}
                onChange={(e) => setMovementQty(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select value={movementReason} onValueChange={setMovementReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {movementType === "ENTRY" ? (
                    <>
                      <SelectItem value="Compra">Compra / Reposição</SelectItem>
                      <SelectItem value="Devolução">Devolução</SelectItem>
                      <SelectItem value="Ajuste de Inventário">Ajuste de Inventário (+)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Entrega ao Colaborador">Entrega ao Colaborador</SelectItem>
                      <SelectItem value="Descarte / Avaria">Descarte / Avaria</SelectItem>
                      <SelectItem value="Ajuste de Inventário">Ajuste de Inventário (-)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleMovementSubmit}
              className={movementType === "ENTRY" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              Confirmar {movementType === "ENTRY" ? "Entrada" : "Saída"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockDashboard;