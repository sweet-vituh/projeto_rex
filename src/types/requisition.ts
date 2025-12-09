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
  code?: string;
  quantity: number;
  priority: Priority;
  problem_description: string;
  photos: string[];
  status: Status;
  created_by: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  rejection_reason?: string;
}
