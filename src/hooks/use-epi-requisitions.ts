import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EpiRequisition } from "@/types/epi";

interface UseEpiRequisitionsOptions {
  userId?: string;
  filterByRequester?: boolean;
  filterByAssignedTo?: boolean;
}

export function useEpiRequisitions(options: UseEpiRequisitionsOptions = {}) {
  const { userId, filterByRequester = false, filterByAssignedTo = false } = options;
  const [requisitions, setRequisitions] = useState<EpiRequisition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequisitions = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('epi_requisitions')
        .select(`
          *,
          epi_item:epi_items (id, name, category, size, stock_quantity, min_stock_quantity),
          requester_username:user_roles (username)
        `)
        .order('created_at', { ascending: false });

      if (filterByRequester && userId) {
        query = query.eq('user_id', userId);
      }
      if (filterByAssignedTo && userId) {
        query = query.eq('assigned_to', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      const formattedData = data.map(req => ({
        ...req,
        epi_item: req.epi_item as EpiRequisition['epi_item'],
        requester_username: (req.requester_username as { username: string } | null)?.username || 'Usuário Desconhecido',
      }));

      setRequisitions(formattedData as EpiRequisition[]);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar requisições de EPI');
    } finally {
      setIsLoading(false);
    }
  }, [userId, filterByRequester, filterByAssignedTo]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchRequisitions();
  }, [fetchRequisitions]);

  useEffect(() => {
    fetchRequisitions();

    const channel = supabase
      .channel('realtime_epi_requisitions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'epi_requisitions',
        },
        (payload) => {
          // Re-fetch all requisitions to ensure joined data is fresh
          // For a more optimized approach, we could update state directly if payload includes all necessary joined data
          refresh(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequisitions, refresh]);

  return { requisitions, isLoading, error, refresh };
}