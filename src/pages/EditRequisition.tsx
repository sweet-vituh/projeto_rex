import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, X } from "lucide-react";
import { Priority } from "@/types/requisition";
import { supabase } from "@/integrations/supabase/client";

const EditRequisition = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const areas = ["Produção", "Manutenção", "Qualidade", "Logística"];
  const equipmentsByArea: Record<string, string[]> = {
    "Produção": ["Torno CNC 01", "Fresadora 02", "Prensa 03"],
    "Manutenção": ["Compressor 01", "Gerador 02"],
    "Qualidade": ["Paquímetro Digital", "Micrômetro"],
    "Logística": ["Empilhadeira 01", "Paleteira"]
  };
  
  const itemCategories = ["Ferramentas", "Peças", "EPIs", "Materiais"];
  const itemsByCategory: Record<string, Array<{ code: string; name: string }>> = {
    "Ferramentas": [
      { code: "FER-001", name: "Chave Phillips 1/4" },
      { code: "FER-002", name: "Alicate Universal 8" },
      { code: "FER-003", name: "Martelo 500g" }
    ],
    "Peças": [
      { code: "PEC-001", name: "Rolamento SKF 6205" },
      { code: "PEC-002", name: "Correia A-45" },
      { code: "PEC-003", name: "Parafuso M8x20" }
    ],
    "EPIs": [
      { code: "EPI-001", name: "Luva de Segurança" },
      { code: "EPI-002", name: "Óculos de Proteção" },
      { code: "EPI-003", name: "Capacete" }
    ],
    "Materiais": [
      { code: "MAT-001", name: "Graxa Automotiva" },
      { code: "MAT-002", name: "Óleo Hidráulico" },
      { code: "MAT-003", name: "Fita Isolante" }
    ]
  };

  const [area, setArea] = useState("");
  const [equipment, setEquipment] = useState("");
  const [category, setCategory] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [priority, setPriority] = useState<Priority>("Normal");
  const [problemDescription, setProblemDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRequisition = async () => {
      const { data, error } = await supabase
        .from('requisitions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        toast({
          title: "Erro ao carregar requisição",
          description: "Não foi possível carregar os dados",
          variant: "destructive",
        });
        navigate("/home");
        return;
      }

      if (data) {
        setArea(data.area);
        setEquipment(data.equipment);
        setItemCode(data.item_code || "");
        setQuantity(data.quantity.toString());
        setPriority(data.priority as Priority);
        setProblemDescription(data.problem_description);
        setPhotos(data.photos || []);

        // Encontrar categoria do item
        for (const [cat, items] of Object.entries(itemsByCategory)) {
          if (items.some(item => item.code === data.item_code)) {
            setCategory(cat);
            break;
          }
        }
      }
    };

    fetchRequisition();
  }, [id, navigate, toast]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (photos.length + files.length > 5) {
      toast({
        title: "Limite de fotos",
        description: "Máximo de 5 fotos por requisição",
        variant: "destructive",
      });
      return;
    }

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!area || !equipment || !category || !itemCode || !problemDescription) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const selectedItem = itemsByCategory[category]?.find(item => item.code === itemCode);

      const { error } = await supabase
        .from('requisitions')
        .update({
          area,
          equipment,
          item_description: selectedItem?.name || itemCode,
          item_code: itemCode,
          quantity: parseInt(quantity),
          priority,
          problem_description: problemDescription,
          photos
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Requisição atualizada!",
        description: "Suas alterações foram salvas com sucesso",
      });
      navigate("/home");
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar requisição",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home")} className="transition-all duration-200 hover:bg-accent">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Editar Requisição</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Informações do Equipamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="area">Área / Setor *</Label>
                <Select value={area} onValueChange={setArea}>
                  <SelectTrigger id="area" className="transition-all duration-200">
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">Equipamento *</Label>
                <Select value={equipment} onValueChange={setEquipment} disabled={!area}>
                  <SelectTrigger id="equipment" className="transition-all duration-200">
                    <SelectValue placeholder={area ? "Selecione o equipamento" : "Selecione a área primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {area && equipmentsByArea[area]?.map((eq) => (
                      <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem">Descrição do Problema *</Label>
                <Textarea
                  id="problem"
                  placeholder="Descreva o problema encontrado..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  rows={4}
                  required
                  className="transition-all duration-200 focus:shadow-md"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Item Requisitado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={category} onValueChange={(value) => {
                  setCategory(value);
                  setItemCode("");
                }}>
                  <SelectTrigger id="category" className="transition-all duration-200">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item">Item *</Label>
                <Select value={itemCode} onValueChange={setItemCode} disabled={!category}>
                  <SelectTrigger id="item" className="transition-all duration-200">
                    <SelectValue placeholder={category ? "Selecione o item" : "Selecione a categoria primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {category && itemsByCategory[category]?.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        {item.code} - {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="transition-all duration-200 focus:shadow-md"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade *</Label>
                  <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                    <SelectTrigger id="priority" className="transition-all duration-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Fotos (máx. 5)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border animate-scale-in">
                      <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 transition-all duration-200 hover:scale-110"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 5 && (
                <Label
                  htmlFor="photos"
                  className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-all duration-200"
                >
                  <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Adicionar foto</span>
                  <Input
                    id="photos"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    multiple
                  />
                </Label>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 transition-all duration-200 hover:bg-accent"
              onClick={() => navigate("/home")}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 transition-all duration-200 hover:scale-105" 
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditRequisition;
