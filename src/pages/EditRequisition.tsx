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
import { useCatalogItems, CatalogItem } from "@/hooks/use-catalog-items";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";

const EditRequisition = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items: catalogItems, isLoading: isLoadingCatalog, areas, getEquipmentsByArea, getCategoriesByAreaAndEquipment, getFilteredItems } = useCatalogItems();
  
  const [area, setArea] = useState("");
  const [equipment, setEquipment] = useState("");
  const [category, setCategory] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(""); // Stores catalog_item.id
  const [quantity, setQuantity] = useState("1");
  const [priority, setPriority] = useState<Priority>("Normal");
  const [problemDescription, setProblemDescription] = useState("");
  const [justification, setJustification] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const COST_CENTERS = [
    "1147 - Forno de Vidro",
    "6700 - Corte/Esquadramento",
    "1066 - Preparação da Massa",
    "1082 - Prensagem",
    "1074 - Atomização",
    "1104 - Esmaltação/Decor",
    "2577 - E.T.E",
    "2291 - Edificio industrial",
    "2232 - ADM Industrial",
    "1163 - Classificação",
    "2348 - Compressores",
    "2240 - Depto Tecnico",
    "1619 - Expedição",
    "1660 - Manutenção Mecânica",
    "1678 - Manutenção Elétrica",
    "2330 - Parque Fabri"
  ];

  useEffect(() => {
    if (isLoadingCatalog) return;
    
    // Wait for catalog items to load
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
        setQuantity(data.quantity.toString());
        setPriority(data.priority as Priority);
        setProblemDescription(data.problem_description);
        setJustification(data.justification || "");
        setCostCenter(data.cost_center || "");
        setPhotos(data.photos || []);
        
        // Find the catalog item and set category/selectedItemId
        const foundItem = catalogItems.find(
          (item) => item.item_code === data.item_code && 
                   item.system_description === data.item_description
        );
        
        if (foundItem) {
          setCategory(foundItem.category);
          setSelectedItemId(foundItem.id);
        } else {
          // If item not found in catalog, try to find by description only
          const itemByDescription = catalogItems.find(
            item => item.system_description === data.item_description ||
                    item.item_description === data.item_description
          );
          
          if (itemByDescription) {
            setCategory(itemByDescription.category);
            setSelectedItemId(itemByDescription.id);
          }
        }
      }
    };
    
    fetchRequisition();
  }, [id, navigate, toast, catalogItems, isLoadingCatalog]);

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
    
    if (!area || !equipment || !category || !selectedItemId || !problemDescription || !justification || !costCenter || parseInt(quantity) <= 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios e verifique a quantidade",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const selectedCatalogItem = catalogItems.find(item => item.id === selectedItemId);
      
      if (!selectedCatalogItem) {
        throw new Error("Item do catálogo não encontrado.");
      }
      
      const { error } = await supabase
        .from('requisitions')
        .update({
          area,
          equipment,
          item_description: selectedCatalogItem.system_description || selectedCatalogItem.item_description,
          item_code: selectedCatalogItem.item_code,
          quantity: parseInt(quantity),
          priority,
          problem_description: problemDescription,
          justification,
          cost_center: costCenter,
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

  if (isLoadingCatalog) {
    return (
      <div className="min-h-screen bg-background animate-fade-in">
        <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Editar Requisição</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const availableEquipments = area ? getEquipmentsByArea(area) : [];
  const availableCategories = area && equipment ? getCategoriesByAreaAndEquipment(area, equipment) : [];
  const availableItems = area && equipment && category ? getFilteredItems(area, equipment, category) : [];
  const selectedCatalogItem = catalogItems.find(item => item.id === selectedItemId);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home")} className="transition-all duration-200 hover:bg-accent">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Editar Requisição</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="costCenter">Centro de Custo *</Label>
                <Select value={costCenter} onValueChange={setCostCenter}>
                  <SelectTrigger id="costCenter">
                    <SelectValue placeholder="Selecione o centro de custo" />
                  </SelectTrigger>
                  <SelectContent>
                    {COST_CENTERS.map((cc) => (
                      <SelectItem key={cc} value={cc}>{cc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade *</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Urgente">Urgente</SelectItem>
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
              
              <div className="space-y-2">
                <Label htmlFor="justification">Justificativa *</Label>
                <Textarea 
                  id="justification" 
                  placeholder="Justifique a necessidade deste material..." 
                  value={justification} 
                  onChange={(e) => setJustification(e.target.value)} 
                  rows={3} 
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Área / Setor *</Label>
                  <Select 
                    value={area} 
                    onValueChange={(v) => { 
                      setArea(v); 
                      setEquipment(""); 
                      setCategory(""); 
                      setSelectedItemId(""); 
                    }}
                  >
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
                  <Select 
                    value={equipment} 
                    onValueChange={(v) => { 
                      setEquipment(v); 
                      setCategory(""); 
                      setSelectedItemId(""); 
                    }} 
                    disabled={!area}
                  >
                    <SelectTrigger id="equipment" className="transition-all duration-200">
                      <SelectValue placeholder={area ? "Selecione o equipamento" : "Selecione a área primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEquipments.map((eq) => (
                        <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select 
                    value={category} 
                    onValueChange={(v) => { 
                      setCategory(v); 
                      setSelectedItemId(""); 
                    }} 
                    disabled={!equipment}
                  >
                    <SelectTrigger id="category" className="transition-all duration-200">
                      <SelectValue placeholder={equipment ? "Selecione a categoria" : "Selecione o equipamento primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="item">Item *</Label>
                <Select 
                  value={selectedItemId} 
                  onValueChange={setSelectedItemId} 
                  disabled={!category}
                >
                  <SelectTrigger id="item" className="transition-all duration-200">
                    <SelectValue placeholder={category ? "Selecione o item" : "Selecione a categoria primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.item_code} - {item.system_description || item.item_description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedCatalogItem && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p><strong>Código:</strong> {selectedCatalogItem.item_code}</p>
                  <p><strong>Descrição:</strong> {selectedCatalogItem.system_description || selectedCatalogItem.item_description}</p>
                </div>
              )}
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