import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Snapshot {
  id: string;
  image_url: string;
  captured_at: string;
  time_slot: string;
  camera: {
    id: string;
    name: string;
    slug: string;
    description: string;
    elevation_ft: number | null;
  };
}

const timeToSlot = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
};

export const useWebcamData = (selectedDates: Date[], selectedTimes: string[]) => {
  return useQuery({
    queryKey: ['webcam-snapshots', selectedDates.map(d => format(d, 'yyyy-MM-dd')).sort(), selectedTimes],
    queryFn: async () => {
      if (selectedDates.length === 0 || selectedTimes.length === 0) return [];

      const timeSlots = selectedTimes.map(timeToSlot);

      // Build date filter: OR across all selected dates
      const dateFilters = selectedDates.map(d => {
        const dateStr = format(d, 'yyyy-MM-dd');
        return `and(captured_at.gte.${dateStr}T00:00:00,captured_at.lte.${dateStr}T23:59:59)`;
      });

      const { data, error } = await supabase
        .from('snapshots')
        .select(`
          id,
          image_url,
          captured_at,
          time_slot,
          camera:cameras (
            id,
            name,
            slug,
            description,
            elevation_ft
          )
        `)
        .or(dateFilters.join(','))
        .in('time_slot', timeSlots)
        .order('captured_at', { ascending: false });

      if (error) {
        console.error('Error fetching snapshots:', error);
        throw error;
      }

      return (data as Snapshot[]) || [];
    },
    staleTime: 60000,
  });
};