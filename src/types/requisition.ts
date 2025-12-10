export type Priority = "Baixa" | "Normal" | "Urgente";
export type Status = 
  | "pendente" 
  | "em_andamento" 
  | "pre_liberacao" 
  | "coleta_emitida" 
  | "material_disponivel" 
  | "concluido" 
  | "encerrada_sem_liberacao" 
  | "rejeitado" 
  | "caducou";

export interface Requisition {
  id: string;
  area: string;
  equipment: string;
  item_description: string;
  item_code?: string | null; // Changed to allow null
  quantity: number;
  priority: Priority;
  problem_description: string;
  justification?: string | null; // Added justification
  cost_center?: string | null; // Added cost_center
  photos: string[];
  status: Status;
  created_by: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string | null; // Changed to allow null
  rejection_reason?: string | null; // Changed to allow null
  transferred_from?: string | null; // Added transferred_from
}