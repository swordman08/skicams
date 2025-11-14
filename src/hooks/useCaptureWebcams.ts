import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCaptureWebcams = () => {
  const { toast } = useToast();

  const captureWebcams = async () => {
    try {
      console.log('Triggering webcam capture...');
      
      const { data, error } = await supabase.functions.invoke('capture-webcams');

      if (error) {
        console.error('Error capturing webcams:', error);
        toast({
          title: "Capture Failed",
          description: error.message || "Failed to capture webcam images",
          variant: "destructive",
        });
        return { success: false, error };
      }

      console.log('Webcam capture result:', data);
      
      toast({
        title: "Capture Complete",
        description: `Successfully captured ${data.results?.filter((r: any) => r.success).length || 0} webcam images`,
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error triggering webcam capture:', error);
      toast({
        title: "Error",
        description: "Failed to trigger webcam capture",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return { captureWebcams };
};
