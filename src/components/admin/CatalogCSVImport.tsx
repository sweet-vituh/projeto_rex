import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Upload, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CatalogCSVImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const REQUIRED_FIELDS = ["item_code", "item_description", "system_description", "area", "category", "equipment"];
const FIELD_LABELS: Record<string, string> = {
  item_code: "Código do Item",
  item_description: "Descrição do Item",
  system_description: "Descrição no Sistema",
  area: "Área / Setor",
  category: "Categoria",
  equipment: "Equipamento",
};

export function CatalogCSVImport({ open, onOpenChange, onSuccess }: CatalogCSVImportProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return { headers: [], data: [] };
    
    const parseRow = (row: string) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (const char of row) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === "," || char === ";") && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseRow(lines[0]);
    const data = lines.slice(1).map(parseRow);
    
    return { headers, data };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers, data } = parseCSV(text);
      setCsvHeaders(headers);
      setCsvData(data);
      
      // Auto-map columns by similarity
      const autoMapping: Record<string, string> = {};
      REQUIRED_FIELDS.forEach(field => {
        const match = headers.find(h => 
          h.toLowerCase().includes(field.replace("_", " ").toLowerCase()) ||
          h.toLowerCase().includes(field.replace("_", "").toLowerCase()) ||
          FIELD_LABELS[field].toLowerCase().includes(h.toLowerCase()) ||
          h.toLowerCase().includes(FIELD_LABELS[field].toLowerCase())
        );
        if (match) autoMapping[field] = match;
      });
      setColumnMapping(autoMapping);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    // Validate all required fields are mapped
    const missingFields = REQUIRED_FIELDS.filter(f => !columnMapping[f]);
    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios não mapeados",
        description: missingFields.map(f => FIELD_LABELS[f]).join(", "),
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const items = csvData.map(row => {
        const item: Record<string, string | boolean> = { is_active: true };
        REQUIRED_FIELDS.forEach(field => {
          const headerIndex = csvHeaders.indexOf(columnMapping[field]);
          item[field] = row[headerIndex] || "";
        });
        return item;
      }).filter(item => item.item_code && item.item_description);

      if (items.length === 0) {
        throw new Error("Nenhum item válido encontrado no CSV");
      }

      const { error } = await supabase.from("catalog_items").insert(items as any[]);
      if (error) throw error;

      toast({ title: `${items.length} itens importados com sucesso` });
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setCsvHeaders([]);
    setCsvData([]);
    setColumnMapping({});
    onOpenChange(false);
  };

  const allFieldsMapped = REQUIRED_FIELDS.every(f => columnMapping[f]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Itens via CSV
          </DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV e mapeie as colunas para os campos do sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File upload */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full h-20 border-dashed"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6" />
                <span>{csvHeaders.length > 0 ? "Trocar arquivo" : "Selecionar arquivo CSV"}</span>
              </div>
            </Button>
          </div>

          {/* Column mapping */}
          {csvHeaders.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Mapeamento de Colunas</span>
                <span className="text-muted-foreground">{csvData.length} linhas encontradas</span>
              </div>
              
              <div className="grid gap-3">
                {REQUIRED_FIELDS.map(field => (
                  <div key={field} className="grid grid-cols-2 gap-4 items-center">
                    <Label className="text-sm">{FIELD_LABELS[field]} *</Label>
                    <Select
                      value={columnMapping[field] || ""}
                      onValueChange={(value) => setColumnMapping(prev => ({ ...prev, [field]: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map(header => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Preview */}
              {allFieldsMapped && csvData.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Prévia (primeira linha):</span>
                  <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                    {REQUIRED_FIELDS.map(field => {
                      const headerIndex = csvHeaders.indexOf(columnMapping[field]);
                      return (
                        <p key={field}>
                          <span className="font-medium">{FIELD_LABELS[field]}:</span>{" "}
                          {csvData[0]?.[headerIndex] || "-"}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!allFieldsMapped || csvData.length === 0 || isImporting}
          >
            {isImporting ? "Importando..." : `Importar ${csvData.length} itens`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
