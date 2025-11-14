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

export const useWebcamData = (selectedDate: Date, selectedTime: string) => {
  return useQuery({
    queryKey: ['webcam-snapshots', selectedDate, selectedTime],
    queryFn: async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Convert time format (e.g., "10:30" to "10:30 AM")
      const [hours, minutes] = selectedTime.split(':');
      const hour = parseInt(hours);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const timeSlot = `${displayHour}:${minutes} ${period}`;

      console.log('Fetching snapshots for:', { dateStr, timeSlot });

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
        .gte('captured_at', `${dateStr}T00:00:00`)
        .lte('captured_at', `${dateStr}T23:59:59`)
        .eq('time_slot', timeSlot)
        .order('captured_at', { ascending: false });

      if (error) {
        console.error('Error fetching snapshots:', error);
        throw error;
      }

      console.log('Fetched snapshots:', data);

      return (data as Snapshot[]) || [];
    },
    staleTime: 60000, // 1 minute
  });
};
