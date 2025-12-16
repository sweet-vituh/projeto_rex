import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, HardHat } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

const EPI_TYPES = [
  "Uniforme",
  "Calçado",
  "Luva",
  "Óculos",
  "Protetor Auricular",
  "Capacete",
  "Máscara",
  "Cinto de Segurança",
  "Outros"
];

const JUSTIFICATIONS = [
  "Desgaste natural",
  "Perda",
  "Dano/Avaria",
  "Primeira entrega (Novo funcionário)",
  "Vencimento da validade",
  "Troca de função"
];

const NewEpiRequisition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    item_type: "",
    item_name: "",
    size: "",
    quantity: "1",
    justification: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.item_type || !formData.item_name || !formData.justification || !formData.quantity) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('epi_requisitions')
        .insert({
          created_by: user.id,
          item_type: formData.item_type,
          item_name: formData.item_name,
          size: formData.size || null,
          quantity: parseInt(formData.quantity),
          justification: formData.justification
        });

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: "Seu pedido de EPI foi registrado com sucesso.",
      });

      navigate("/epi/home");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showSizeInput = ["Uniforme", "Calçado", "Luva"].includes(formData.item_type);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/epi/home")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-orange-500">Solicitar EPI</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-orange-500" />
                Dados do Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="item_type">Tipo de EPI *</Label>
                <Select 
                  value={formData.item_type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, item_type: v }))}
                >
                  <SelectTrigger id="item_type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {EPI_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item_name">Descrição / Modelo *</Label>
                <Input 
                  id="item_name" 
                  placeholder="Ex: Botina de Segurança Bico PVC"
                  value={formData.item_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                  required
                />
              </div>

              {showSizeInput && (
                <div className="space-y-2">
                  <Label htmlFor="size">Tamanho / Numeração</Label>
                  <Input 
                    id="size" 
                    placeholder="Ex: 42, G, GG..."
                    value={formData.size}
                    onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification">Motivo da Solicitação *</Label>
                <Select 
                  value={formData.justification} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, justification: v }))}
                >
                  <SelectTrigger id="justification">
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {JUSTIFICATIONS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => navigate("/epi/home")}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" 
              disabled={isLoading}
            >
              {isLoading ? "Enviando..." : "Confirmar Solicitação"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default NewEpiRequisition;