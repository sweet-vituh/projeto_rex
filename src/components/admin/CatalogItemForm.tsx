import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CatalogItem } from "@/hooks/use-catalog-items";
import { useCategories } from "@/hooks/use-categories";

interface CatalogItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<CatalogItem>) => Promise<void>;
  item?: CatalogItem | null;
  isLoading?: boolean;
}

const emptyForm = {
  item_code: "",
  item_description: "",
  system_description: "",
  area: "",
  category: "",
  equipment: "",
  is_active: true,
};

export function CatalogItemForm({
  open,
  onOpenChange,
  onSubmit,
  item,
  isLoading,
}: CatalogItemFormProps) {
  const [formData, setFormData] = useState(emptyForm);
  const { categories } = useCategories();

  useEffect(() => {
    if (item) {
      setFormData({
        item_code: item.item_code,
        item_description: item.item_description,
        system_description: item.system_description || "",
        area: item.area,
        category: item.category,
        equipment: item.equipment,
        is_active: item.is_active,
      });
    } else {
      setFormData(emptyForm);
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      system_description: formData.system_description || null,
    });
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Editar Item" : "Novo Item"}</DialogTitle>
          <DialogDescription>
            {item
              ? "Altere os dados do item do catálogo"
              : "Preencha os dados do novo item"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item_code">Código do Item *</Label>
            <Input
              id="item_code"
              value={formData.item_code}
              onChange={(e) => handleChange("item_code", e.target.value)}
              placeholder="Ex: FER-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item_description">Descrição do Item *</Label>
            <Input
              id="item_description"
              value={formData.item_description}
              onChange={(e) => handleChange("item_description", e.target.value)}
              placeholder="Ex: Chave Phillips 1/4 (nome informal)"
              required
            />
            <p className="text-xs text-muted-foreground">Nome como chamam no caderno</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="system_description">Descrição no Sistema *</Label>
            <Input
              id="system_description"
              value={formData.system_description}
              onChange={(e) => handleChange("system_description", e.target.value)}
              placeholder="Ex: CHAVE PHILLIPS 1/4 POL"
              required
            />
            <p className="text-xs text-muted-foreground">Texto mostrado nos dropdowns para mecânicos/PCMs</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Área / Setor *</Label>
            <Input
              id="area"
              value={formData.area}
              onChange={(e) => handleChange("area", e.target.value)}
              placeholder="Ex: Produção"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange("category", value)}
              required
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categories.length === 0 && (
              <p className="text-xs text-destructive">Cadastre categorias primeiro</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment">Equipamento *</Label>
            <Input
              id="equipment"
              value={formData.equipment}
              onChange={(e) => handleChange("equipment", e.target.value)}
              placeholder="Ex: Torno CNC 01"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange("is_active", checked)}
            />
            <Label htmlFor="is_active">Item ativo</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || categories.length === 0}>
              {isLoading ? "Salvando..." : item ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
