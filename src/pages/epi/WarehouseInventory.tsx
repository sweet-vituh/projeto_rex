import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Search, Plus, Minus, History, LogOut } from "lucide-react";
import { EpiItem, EpiStockMovement } from "@/types/epi";

export default function WarehouseInventory() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<EpiItem[]>([]);
  const [movements, setMovements] = useState<EpiStockMovement[]>([]);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<EpiItem | null>(null);
  const [movementType, setMovementType] = useState<'in' | 'out'>('in');
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from('epi_items').select('*').order('name');
    if (data) setItems(data as EpiItem[]);
  };

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('epi_stock_movements')
      .select('*, epi_items(name), user_roles(username)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setMovements(data as any);
  };

  useEffect(() => {
    fetchData();
    fetchHistory();
  }, []);

  const handleStockUpdate = async () => {
    if (!selectedItem || !qty || !user) return;
    const quantity = parseInt(qty);
    if (isNaN(quantity) || quantity <= 0) return;

    const finalQty = movementType === 'in' ? quantity : -quantity;
    const newStock = selectedItem.current_stock + finalQty;

    if (newStock < 0) {
      toast({ title: "Erro", description: "Estoque insuficiente para esta saída.", variant: "destructive" });
      return;
    }

    try {
      // Update item
      await supabase.from('epi_items').update({ current_stock: newStock }).eq('id', selectedItem.id);
      
      // Log movement
      await supabase.from('epi_stock_movements').insert({
        epi_item_id: selectedItem.id,
        user_id: user.id,
        quantity: finalQty,
        movement_type: movementType === 'in' ? 'entrada' : 'ajuste',
        notes: notes || (movementType === 'in' ? 'Entrada manual' : 'Saída manual/Ajuste')
      });

      toast({ title: "Estoque atualizado!" });
      setSelectedItem(null);
      setQty("");
      setNotes("");
      fetchData();
      fetchHistory();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" />
            <div>
              <h1 className="text-xl font-bold">Almoxarifado EPI</h1>
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
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar item..." 
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
            <History className="w-4 h-4 mr-2" />
            {showHistory ? "Ver Inventário" : "Ver Histórico"}
          </Button>
        </div>

        {showHistory ? (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Obs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map(mov => (
                    <TableRow key={mov.id}>
                      <TableCell>{new Date(mov.created_at).toLocaleDateString()} {new Date(mov.created_at).toLocaleTimeString()}</TableCell>
                      <TableCell>{mov.epi_items?.name}</TableCell>
                      <TableCell>
                        <Badge variant={mov.quantity > 0 ? "default" : "secondary"}>
                          {mov.movement_type === 'entrada' ? 'Entrada' : mov.movement_type === 'saida_requisicao' ? 'Requisição' : 'Ajuste'}
                        </Badge>
                      </TableCell>
                      <TableCell className={mov.quantity > 0 ? "text-green-600" : "text-red-600"}>
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                      </TableCell>
                      <TableCell>{mov.user_roles?.username || 'Sistema'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{mov.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <Card key={item.id} className="hover:border-primary/50 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {item.name}
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.current_stock} <span className="text-sm font-normal text-muted-foreground">{item.unit}</span></div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Mínimo: {item.min_stock} | Tamanho: {item.size || 'N/A'}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { setSelectedItem(item); setMovementType('in'); }}>
                      <Plus className="w-4 h-4 mr-1" /> Entrada
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedItem(item); setMovementType('out'); }}>
                      <Minus className="w-4 h-4 mr-1" /> Ajuste/Saída
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementType === 'in' ? 'Registrar Entrada' : 'Registrar Saída/Ajuste'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <h4 className="font-medium">{selectedItem?.name}</h4>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Input placeholder="Ex: Nota Fiscal 123..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>Cancelar</Button>
            <Button onClick={handleStockUpdate}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}