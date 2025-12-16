import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Package } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EpiItem } from "@/types/epi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewEpiRequisition() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<EpiItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<EpiItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [justification, setJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase
        .from('epi_items')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (data) setItems(data as EpiItem[]);
    };
    fetchItems();
  }, []);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedItem) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from('epi_requisitions').insert({
        user_id: user.id,
        epi_item_id: selectedItem.id,
        quantity: quantity,
        justification: justification,
        status: 'pendente'
      });

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: `Seu pedido de ${selectedItem.name} foi enviado para aprovação.`,
      });
      setSelectedItem(null);
      navigate('/epi/home');
    } catch (error: any) {
      toast({
        title: "Erro ao solicitar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/epi/home")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Solicitar EPI</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar EPI (ex: Luva, Óculos)..." 
            className="pl-10 h-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid gap-3">
          {filteredItems.map(item => (
            <Card 
              key={item.id} 
              className="cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => setSelectedItem(item)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Package className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                  <div className="flex gap-2 mt-1">
                    {item.size && <span className="text-xs bg-secondary px-2 py-0.5 rounded">Tam: {item.size}</span>}
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded">Estoque: {item.current_stock}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Selecionar</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar {selectedItem?.name}</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da sua solicitação.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4">
               <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                  {selectedItem?.image_url ? (
                    <img src={selectedItem.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                   <p className="font-medium">Tamanho: {selectedItem?.size || 'Único'}</p>
                   <p className="text-sm text-muted-foreground">Disponível: {selectedItem?.current_stock} {selectedItem?.unit}</p>
                </div>
            </div>

            <div className="space-y-2">
              <Label>Quantidade ({selectedItem?.unit})</Label>
              <Input 
                type="number" 
                min="1" 
                max={10} 
                value={quantity} 
                onChange={(e) => setQuantity(parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Justificativa (Opcional)</Label>
              <Textarea 
                placeholder="Ex: Minha luva atual rasgou..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Confirmar Solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}