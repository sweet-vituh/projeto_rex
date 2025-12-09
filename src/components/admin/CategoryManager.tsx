import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Upload, Tags } from "lucide-react";
import { useCategories, Category } from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";

export function CategoryManager() {
  const { toast } = useToast();
  const { categories, isLoading, addCategory, updateCategory, deleteCategory, importCategories } = useCategories();
  
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    setIsSaving(true);
    try {
      await addCategory(newCategory.trim());
      setNewCategory("");
      toast({ title: "Categoria adicionada" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCategory || !editName.trim()) return;
    setIsSaving(true);
    try {
      await updateCategory(editingCategory.id, editName.trim());
      setEditingCategory(null);
      toast({ title: "Categoria atualizada" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      toast({ title: "Categoria removida" });
    } catch (error: any) {
      toast({ title: "Erro ao remover", description: "Pode haver itens usando esta categoria", variant: "destructive" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) return;
    setIsSaving(true);
    try {
      const lines = csvContent.split("\n").map(l => l.trim()).filter(l => l);
      const names = lines.flatMap(line => line.split(",").map(n => n.trim()));
      const count = await importCategories(names);
      setIsImportOpen(false);
      setCsvContent("");
      toast({ title: `${count} categorias importadas` });
    } catch (error: any) {
      toast({ title: "Erro na importação", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tags className="w-5 h-5" />
            Categorias ({categories.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new category */}
        <div className="flex gap-2">
          <Input
            placeholder="Nova categoria..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={!newCategory.trim() || isSaving}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Categories list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma categoria cadastrada
          </p>
        ) : (
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group"
              >
                <span className="text-sm">{cat.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(cat)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(cat)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Nome da categoria"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={isSaving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Categorias</DialogTitle>
            <DialogDescription>
              Selecione um arquivo CSV ou cole os nomes (um por linha ou separados por vírgula)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivo
            </Button>
            <textarea
              className="w-full h-32 p-3 text-sm border rounded-lg bg-background resize-none"
              placeholder="Categoria 1&#10;Categoria 2&#10;Categoria 3"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>Cancelar</Button>
            <Button onClick={handleImport} disabled={!csvContent.trim() || isSaving}>
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Remover "{deleteTarget?.name}"? Itens usando esta categoria podem ficar sem categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
