import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TrailMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapType: "winter" | "northway";
}

export const TrailMapDialog = ({ open, onOpenChange, mapType }: TrailMapDialogProps) => {
  const mapImage = mapType === "winter" 
    ? "/trail-maps/winter-trail-map.jpg" 
    : "/trail-maps/northway-trail-map.jpg";
  const mapTitle = mapType === "winter" ? "Winter Trail Map" : "Northway Trail Map";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] p-4">
        <DialogHeader>
          <DialogTitle>{mapTitle}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-muted/20 rounded-md">
          <img 
            src={mapImage} 
            alt={mapTitle}
            className="w-full h-auto object-contain"
            loading="eager"
            decoding="sync"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
