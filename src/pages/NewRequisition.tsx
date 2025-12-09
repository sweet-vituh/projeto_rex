import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, X, AlertCircle, Plus, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Priority } from "@/types/requisition";
import { supabase } from "@/integrations/supabase/client";
import { useCatalogItems, CatalogItem } from "@/hooks/use-catalog-items";
import { Skeleton } from "@/components/ui/skeleton";

const COST_CENTERS = [
  "1147 - Forno de Vidro",
  "6700 - Corte/Esquadramento",
  "1066 - Preparação da Massa",
  "1082 - Prensagem",
  "1074 - Atomização",
  "1104 - Esmaltação/Decor",
  "2577 - E.T.E",
];

interface RequisitionItem {
  id: string;
  area: string;
  equipment: string;
  category: string;
  selectedItemId: string;
  quantity: string;
}

const createEmptyItem = (): RequisitionItem => ({
  id: crypto.randomUUID(),
  area: "",
  equipment: "",
  category: "",
  selectedItemId: "",
  quantity: "1",
});

const NewRequisition = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    items, 
    isLoading: isLoadingCatalog, 
    areas, 
    getEquipmentsByArea, 
    getCategoriesByAreaAndEquipment, 
    getFilteredItems 
  } = useCatalogItems();

  // Root fields
  const [costCenter, setCostCenter] = useState("");
  const [priority, setPriority] = useState<Priority>("Normal");
  const [problemDescription, setProblemDescription] = useState("");
  const [justification, setJustification] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Multiple items
  const [requisitionItems, setRequisitionItems] = useState<RequisitionItem[]>([createEmptyItem()]);

  const updateItem = (id: string, field: keyof RequisitionItem, value: string) => {
    setRequisitionItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      
      // Reset dependent fields
      if (field === "area") {
        updated.equipment = "";
        updated.category = "";
        updated.selectedItemId = "";
      } else if (field === "equipment") {
        updated.category = "";
        updated.selectedItemId = "";
      } else if (field === "category") {
        updated.selectedItemId = "";
      }
      
      return updated;
    }));
  };

  const addItem = () => {
    setRequisitionItems(prev => [...prev, createEmptyItem()]);
  };

  const removeItem = (id: string) => {
    if (requisitionItems.length === 1) return;
    setRequisitionItems(prev => prev.filter(item => item.id !== id));
  };

  const getSelectedCatalogItem = (selectedItemId: string): CatalogItem | undefined => {
    return items.find(item => item.id === selectedItemId);
  };

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

    // Validation
    if (!costCenter || !problemDescription || !justification) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha centro de custo, descrição do problema e justificativa",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate items
    const invalidItems = requisitionItems.filter(item => 
      !item.area || !item.equipment || !item.category || !item.selectedItemId
    );
    
    if (invalidItems.length > 0) {
      toast({
        title: "Itens incompletos",
        description: "Preencha todos os campos de todos os itens",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Create one requisition per item
      const requisitionsToInsert = requisitionItems.map(reqItem => {
        const catalogItem = getSelectedCatalogItem(reqItem.selectedItemId);
        return {
          created_by: user.id,
          area: reqItem.area,
          equipment: reqItem.equipment,
          item_description: catalogItem?.system_description || catalogItem?.item_description || "",
          item_code: catalogItem?.item_code || "",
          quantity: parseInt(reqItem.quantity),
          priority,
          problem_description: problemDescription,
          justification,
          cost_center: costCenter,
          photos,
        };
      });

      const { error } = await supabase
        .from('requisitions')
        .insert(requisitionsToInsert);

      if (error) throw error;

      toast({
        title: "Requisição enviada!",
        description: `${requisitionItems.length} item(s) requisitado(s) com sucesso`,
      });
      navigate("/home");
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

  const handleSaveDraft = () => {
    toast({
      title: "Rascunho salvo",
      description: "Você pode continuar depois",
    });
    navigate("/home");
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
              <h1 className="text-xl font-bold">Nova Requisição</h1>
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

  const hasCatalogItems = items.length > 0;

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/home")} className="transition-all duration-200 hover:bg-accent">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Nova Requisição</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {!hasCatalogItems ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold mb-2">Catálogo vazio</h2>
              <p className="text-muted-foreground">
                Nenhum item disponível no catálogo. Entre em contato com o administrador.
              </p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Root Info */}
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
                  />
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Itens Requisitados</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {requisitionItems.map((reqItem, index) => {
                  const availableEquipments = reqItem.area ? getEquipmentsByArea(reqItem.area) : [];
                  const availableCategories = reqItem.area && reqItem.equipment 
                    ? getCategoriesByAreaAndEquipment(reqItem.area, reqItem.equipment) : [];
                  const availableItems = reqItem.area && reqItem.equipment && reqItem.category 
                    ? getFilteredItems(reqItem.area, reqItem.equipment, reqItem.category) : [];
                  const selectedCatalogItem = getSelectedCatalogItem(reqItem.selectedItemId);

                  return (
                    <div key={reqItem.id} className="p-4 border rounded-lg space-y-4 relative">
                      {requisitionItems.length > 1 && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeItem(reqItem.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Área / Setor *</Label>
                          <Select value={reqItem.area} onValueChange={(v) => updateItem(reqItem.id, "area", v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {areas.map((a) => (
                                <SelectItem key={a} value={a}>{a}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Equipamento *</Label>
                          <Select 
                            value={reqItem.equipment} 
                            onValueChange={(v) => updateItem(reqItem.id, "equipment", v)}
                            disabled={!reqItem.area}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={reqItem.area ? "Selecione" : "Selecione área"} />
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
                          <Label>Categoria *</Label>
                          <Select 
                            value={reqItem.category} 
                            onValueChange={(v) => updateItem(reqItem.id, "category", v)}
                            disabled={!reqItem.equipment}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={reqItem.equipment ? "Selecione" : "Selecione equipamento"} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Quantidade *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={reqItem.quantity}
                            onChange={(e) => updateItem(reqItem.id, "quantity", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Item *</Label>
                        <Select 
                          value={reqItem.selectedItemId} 
                          onValueChange={(v) => updateItem(reqItem.id, "selectedItemId", v)}
                          disabled={!reqItem.category}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={reqItem.category ? "Selecione o item" : "Selecione categoria"} />
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
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Photos */}
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
                onClick={handleSaveDraft}
                disabled={isLoading}
              >
                Salvar Rascunho
              </Button>
              <Button 
                type="submit" 
                className="flex-1 transition-all duration-200 hover:scale-105" 
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar Requisição"}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default NewRequisition;
