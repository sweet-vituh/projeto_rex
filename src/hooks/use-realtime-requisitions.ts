import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Requisition } from "@/types/requisition";

interface UseRealtimeRequisitionsOptions {
  userId?: string;
  filterByCreator?: boolean;
}

export function useRealtimeRequisitions(options: UseRealtimeRequisitionsOptions = {}) {
  const { userId, filterByCreator = false } = options;
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequisitions = useCallback(async () => {
    try {
      let query = supabase
        .from('requisitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterByCreator && userId) {
        query = query.eq('created_by', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setRequisitions(data as Requisition[]);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar requisições');
    } finally {
      setIsLoading(false);
    }
  }, [userId, filterByCreator]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchRequisitions();
  }, [fetchRequisitions]);

  useEffect(() => {
    fetchRequisitions();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('realtime_requisitions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requisitions',
        },
        (payload) => {
          // Handle different events
          if (payload.eventType === 'INSERT') {
            const newReq = payload.new as Requisition;
            if (!filterByCreator || newReq.created_by === userId) {
              setRequisitions(prev => [newReq, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setRequisitions(prev => 
              prev.map(req => req.id === payload.new.id ? payload.new as Requisition : req)
            );
          } else if (payload.eventType === 'DELETE') {
            setRequisitions(prev => prev.filter(req => req.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, filterByCreator, fetchRequisitions]);

  return { requisitions, isLoading, error, refresh };
}
