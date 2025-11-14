import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import winterTrailMap from "@/assets/winter-trail-map.jpg";
import northwayTrailMap from "@/assets/northway-trail-map.jpg";

interface TrailMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapType: "winter" | "northway";
}

export const TrailMapDialog = ({ open, onOpenChange, mapType }: TrailMapDialogProps) => {
  const mapImage = mapType === "winter" ? winterTrailMap : northwayTrailMap;
  const mapTitle = mapType === "winter" ? "Winter Trail Map" : "Northway Trail Map";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-6">
        <DialogHeader>
          <DialogTitle>{mapTitle}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          <img 
            src={mapImage} 
            alt={mapTitle}
            className="w-full h-auto"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
