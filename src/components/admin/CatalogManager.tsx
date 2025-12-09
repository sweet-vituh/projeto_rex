import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Pencil, Trash2, Package, Upload } from "lucide-react";
import { useCatalogItems, CatalogItem } from "@/hooks/use-catalog-items";
import { CatalogItemForm } from "./CatalogItemForm";
import { CatalogCSVImport } from "./CatalogCSVImport";
import { CategoryManager } from "./CategoryManager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function CatalogManager() {
  const { toast } = useToast();
  const { items, isLoading, refresh, areas, categories } = useCatalogItems({
    includeInactive: true,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<CatalogItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.system_description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = filterArea === "all" || item.area === filterArea;
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;

    return matchesSearch && matchesArea && matchesCategory;
  });

  const handleCreate = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleSubmit = async (data: Partial<CatalogItem>) => {
    setIsSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from("catalog_items")
          .update(data)
          .eq("id", editingItem.id);

        if (error) throw error;

        toast({
          title: "Item atualizado",
          description: "O item foi atualizado com sucesso",
        });
      } else {
        const { error } = await supabase.from("catalog_items").insert(data as {
          item_code: string;
          item_description: string;
          area: string;
          category: string;
          equipment: string;
          system_description?: string | null;
          is_active?: boolean;
        });

        if (error) throw error;

        toast({
          title: "Item criado",
          description: "O novo item foi adicionado ao catálogo",
        });
      }

      setFormOpen(false);
      refresh();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      const { error } = await supabase
        .from("catalog_items")
        .delete()
        .eq("id", deleteItem.id);

      if (error) throw error;

      toast({
        title: "Item removido",
        description: "O item foi removido do catálogo",
      });

      refresh();
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Manager */}
      <CategoryManager />

      {/* Items Section */}
      <div className="space-y-4">
        {/* Header with search and filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, descrição, área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Áreas</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
            </Button>

            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Item
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{items.length} itens no catálogo</span>
          <span>•</span>
          <span>{items.filter((i) => i.is_active).length} ativos</span>
          <span>•</span>
          <span>{filteredItems.length} exibidos</span>
        </div>

        {/* Items list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum item encontrado</p>
              <p className="text-sm">Clique em "Novo Item" para adicionar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className={`animate-fade-in ${!item.is_active ? "opacity-60" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-sm text-primary font-medium">
                          {item.item_code}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {item.area}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                        {!item.is_active && (
                          <Badge variant="destructive" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium truncate">{item.system_description || item.item_description}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.equipment} • {item.item_description}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteItem(item)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <CatalogItemForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        item={editingItem}
        isLoading={isSaving}
      />

      {/* CSV Import Dialog */}
      <CatalogCSVImport
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={refresh}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Item</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o item "{deleteItem?.item_description}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
