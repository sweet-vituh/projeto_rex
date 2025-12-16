export type EpiStatus = "pendente" | "aprovado" | "entregue" | "recusado";
export type EpiMovementType = "entrada" | "saida";

export interface EpiItem {
  id: string;
  name: string;
  category: string;
  size: string | null;
  stock_quantity: number;
  min_stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface EpiRequisition {
  id: string;
  user_id: string;
  epi_item_id: string;
  quantity: number;
  status: EpiStatus;
  observation: string | null;
  created_at: string;
  updated_at: string;
  rejection_reason: string | null;
  assigned_to: string | null;
  // Joined data from epi_items
  epi_item?: EpiItem;
  // Joined data from user_roles for the requester
  requester_username?: string;
}

export interface EpiMovement {
  id: string;
  epi_item_id: string;
  type: EpiMovementType;
  quantity: number;
  performed_by: string | null; // user_id of the warehouse staff
  created_at: string;
  // Joined data from epi_items
  epi_item?: EpiItem;
  // Joined data from user_roles for the performer
  performer_username?: string;
}