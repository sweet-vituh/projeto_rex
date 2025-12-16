import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EpiItem } from "@/types/epi";

interface UseEpiItemsOptions {
  includeInactive?: boolean; // Not directly applicable to EPI items as they don't have an 'is_active' flag yet, but kept for consistency
}

export function useEpiItems(options: UseEpiItemsOptions = {}) {
  const [items, setItems] = useState<EpiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase.from("epi_items").select("*");
      
      // If there was an 'is_active' column, it would be filtered here
      // if (!options.includeInactive) {
      //   query = query.eq("is_active", true);
      // }
      
      const { data, error } = await query.order("category").order("name");

      if (error) throw error;
      setItems(data as EpiItem[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [options.includeInactive]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const categories = [...new Set(items.map((item) => item.category))].sort();
  const sizes = [...new Set(items.map((item) => item.size).filter(Boolean) as string[])].sort();

  return {
    items,
    isLoading,
    error,
    refresh: fetchItems,
    categories,
    sizes,
  };
}