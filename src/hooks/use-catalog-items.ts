import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CatalogItem {
  id: string;
  item_code: string;
  item_description: string;
  system_description: string | null;
  area: string;
  category: string;
  equipment: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UseCatalogItemsOptions {
  includeInactive?: boolean;
}

export function useCatalogItems(options: UseCatalogItemsOptions = {}) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase.from("catalog_items").select("*");
      
      if (!options.includeInactive) {
        query = query.eq("is_active", true);
      }
      
      const { data, error } = await query.order("area").order("category").order("item_description");

      if (error) throw error;
      setItems(data as CatalogItem[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [options.includeInactive]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Get unique areas
  const areas = [...new Set(items.map((item) => item.area))].sort();

  // Get unique categories
  const categories = [...new Set(items.map((item) => item.category))].sort();

  // Get unique equipments
  const equipments = [...new Set(items.map((item) => item.equipment))].sort();

  // Get equipments filtered by area
  const getEquipmentsByArea = (area: string) => {
    return [...new Set(items.filter((item) => item.area === area).map((item) => item.equipment))].sort();
  };

  // Get categories filtered by area and equipment
  const getCategoriesByAreaAndEquipment = (area: string, equipment: string) => {
    return [...new Set(items
      .filter((item) => item.area === area && item.equipment === equipment)
      .map((item) => item.category))].sort();
  };

  // Get items filtered by area, equipment and category
  const getFilteredItems = (area: string, equipment: string, category: string) => {
    return items.filter(
      (item) => item.area === area && item.equipment === equipment && item.category === category
    );
  };

  return {
    items,
    isLoading,
    error,
    refresh: fetchItems,
    areas,
    categories,
    equipments,
    getEquipmentsByArea,
    getCategoriesByAreaAndEquipment,
    getFilteredItems,
  };
}
