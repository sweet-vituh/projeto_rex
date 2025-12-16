export interface EpiItem {
  id: string;
  name: string;
  description: string | null;
  size: string | null;
  unit: string;
  current_stock: number;
  min_stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type EpiStatus = 'pendente' | 'aprovado' | 'recusado' | 'entregue';

export interface EpiRequisition {
  id: string;
  user_id: string;
  epi_item_id: string;
  quantity: number;
  status: EpiStatus;
  justification: string | null;
  rejection_reason: string | null;
  approved_by: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  epi_items?: EpiItem;
  user_roles?: { username: string };
}

export interface EpiStockMovement {
  id: string;
  epi_item_id: string;
  user_id: string;
  quantity: number;
  movement_type: 'entrada' | 'saida_requisicao' | 'ajuste';
  notes: string | null;
  created_at: string;
  // Joins
  epi_items?: EpiItem;
  user_roles?: { username: string };
}