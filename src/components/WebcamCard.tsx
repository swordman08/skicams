import { Card, CardContent } from "@/components/ui/card";
import { WebcamSnapshot } from "@/types/webcam";
import { Camera } from "lucide-react";
import { Link } from "react-router-dom";

interface WebcamCardProps {
  snapshot: WebcamSnapshot;
  date: string;
  time: string;
}

export const WebcamCard = ({ snapshot, date, time }: WebcamCardProps) => {
  return (
    <Link to={`/camera/${encodeURIComponent(snapshot.cameraName)}?date=${date}&time=${time}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          <img
            src={snapshot.imageUrl}
            alt={snapshot.cameraName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">{snapshot.cameraName}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {snapshot.timestamp.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};
