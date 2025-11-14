import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WebcamSnapshot } from "@/types/webcam";
import { Camera, ZoomIn, X, Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WebcamCardProps {
  snapshot: WebcamSnapshot;
  date: string;
  time: string;
}

export const WebcamCard = ({ snapshot, date, time }: WebcamCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDialogOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
        <Link to={`/camera/${encodeURIComponent(snapshot.cameraName)}?date=${date}&time=${time}`}>
          <div className="relative aspect-[4/3] bg-muted overflow-hidden">
            <img
              src={snapshot.imageUrl}
              alt={snapshot.cameraName}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <button
              onClick={handleImageClick}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <ZoomIn className="h-8 w-8 text-white" />
            </button>
          </div>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">{snapshot.cameraName}</h3>
          </div>
          {snapshot.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {snapshot.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {snapshot.timestamp.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </p>
          </CardContent>
        </Link>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
          <DialogHeader className="absolute top-0 right-0 z-10 p-4">
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setIsDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="relative w-full h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center bg-black p-4">
              <img
                src={snapshot.imageUrl}
                alt={snapshot.cameraName}
                className="max-w-full max-h-[85vh] object-contain"
              />
            </div>
                <div className="bg-card p-4 border-t border-border">
                  <h3 className="font-semibold text-lg mb-2">{snapshot.cameraName}</h3>
                  {snapshot.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {snapshot.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {snapshot.timestamp.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {snapshot.timestamp.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </div>
                  </div>
                </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
