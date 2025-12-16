import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEpiItems, EpiItem } from "@/hooks/use-epi-items";
import { Skeleton } from "@/components/ui/skeleton";

const NewEpiRequisition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { items: epiItems, isLoading: isLoadingEpiItems, categories, sizes } = useEpiItems();

  const [selectedEpiItemId, setSelectedEpiItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [observation, setObservation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não autenticado. Faça login novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!selectedEpiItemId || parseInt(quantity) <= 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um EPI e informe uma quantidade válida.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const selectedEpi = epiItems.find(item => item.id === selectedEpiItemId);
    if (!selectedEpi) {
      toast({
        title: "EPI não encontrado",
        description: "O EPI selecionado não está disponível no catálogo.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (parseInt(quantity) > selectedEpi.stock_quantity) {
      toast({
        title: "Estoque insuficiente",
        description: `A quantidade solicitada (${quantity}) excede o estoque disponível (${selectedEpi.stock_quantity}).`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from('epi_requisitions').insert({
        user_id: user.id,
        epi_item_id: selectedEpiItemId,
        quantity: parseInt(quantity),
        observation: observation || null,
        status: "pendente",
      });

      if (error) throw error;

      toast({
        title: "Requisição de EPI enviada!",
        description: "Seu pedido foi enviado para aprovação.",
      });

      navigate("/epi-home");
    } catch (error: any) {
      toast({
        title: "Erro ao enviar requisição",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingEpiItems) {
    return (
      <div className="min-h-screen bg-background animate-fade-in">
        <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/epi-home")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Nova Requisição de EPI</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const hasEpiItems = epiItems.length > 0;
  const selectedEpi = epiItems.find(item => item.id === selectedEpiItemId);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/epi-home")} className="transition-all duration-200 hover:bg-accent">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Nova Requisição de EPI</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {!hasEpiItems ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold mb-2">Catálogo de EPIs vazio</h2>
              <p className="text-muted-foreground">
                Nenhum EPI disponível no catálogo. Entre em contato com o administrador.
              </p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle>Detalhes do EPI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="epiItem">EPI *</Label>
                  <Select
                    value={selectedEpiItemId}
                    onValueChange={setSelectedEpiItemId}
                    required
                  >
                    <SelectTrigger id="epiItem">
                      <SelectValue placeholder="Selecione o EPI" />
                    </SelectTrigger>
                    <SelectContent>
                      {epiItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.category} {item.size ? `- ${item.size}` : ''}) - Estoque: {item.stock_quantity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedEpi && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p><strong>Nome:</strong> {selectedEpi.name}</p>
                    <p><strong>Categoria:</strong> {selectedEpi.category}</p>
                    {selectedEpi.size && <p><strong>Tamanho:</strong> {selectedEpi.size}</p>}
                    <p><strong>Estoque Disponível:</strong> {selectedEpi.stock_quantity}</p>
                    <p><strong>Estoque Mínimo:</strong> {selectedEpi.min_stock_quantity}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observation">Observação (opcional)</Label>
                  <Textarea
                    id="observation"
                    placeholder="Adicione qualquer observação relevante..."
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 transition-all duration-200 hover:bg-accent" 
                onClick={() => navigate("/epi-home")} 
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 transition-all duration-200 hover:scale-105" 
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar Requisição de EPI"}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default NewEpiRequisition;