import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Escucha cambios en lista_items en tiempo real.
 * Llama a onUpdate con el payload cuando hay un cambio.
 */
export function useRealtime(onUpdate) {
  useEffect(() => {
    const channel = supabase
      .channel('lista-cambios')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lista_items' },
        (payload) => onUpdate(payload)
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [onUpdate])
}
