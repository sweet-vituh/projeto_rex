import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data as Category[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (name: string) => {
    const { error } = await supabase.from("categories").insert({ name });
    if (error) throw error;
    await fetchCategories();
  };

  const updateCategory = async (id: string, name: string) => {
    const { error } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", id);
    if (error) throw error;
    await fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    await fetchCategories();
  };

  const importCategories = async (names: string[]) => {
    const uniqueNames = [...new Set(names.filter(n => n.trim()))];
    const existing = categories.map(c => c.name.toLowerCase());
    const toInsert = uniqueNames
      .filter(n => !existing.includes(n.toLowerCase()))
      .map(name => ({ name: name.trim() }));
    
    if (toInsert.length === 0) return 0;
    
    const { error } = await supabase.from("categories").insert(toInsert);
    if (error) throw error;
    await fetchCategories();
    return toInsert.length;
  };

  return {
    categories,
    isLoading,
    error,
    refresh: fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    importCategories,
  };
}
