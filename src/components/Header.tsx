import { useState } from "react";
import { Mountain, History as HistoryIcon, Map, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrailMapDialog } from "@/components/TrailMapDialog";

export const Header = () => {
  const location = useLocation();
  const isHistoryPage = location.pathname === "/history";
  const [trailMapOpen, setTrailMapOpen] = useState(false);
  const [mapType, setMapType] = useState<"winter" | "northway">("winter");

  const openTrailMap = (type: "winter" | "northway") => {
    setMapType(type);
    setTrailMapOpen(true);
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Mountain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Crystal Mountain Cams</h1>
              <p className="text-sm text-muted-foreground">Webcam History Tracker</p>
            </div>
          </Link>
          
          <nav className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => openTrailMap("winter")}
            >
              <Map className="h-4 w-4" />
              Trail Map
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => openTrailMap("northway")}
            >
              <Map className="h-4 w-4" />
              Northway
            </Button>
            {!isHistoryPage ? (
              <Button asChild variant="outline" className="gap-2">
                <Link to="/history">
                  <HistoryIcon className="h-4 w-4" />
                  Full History
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="gap-2">
                <Link to="/">
                  <Mountain className="h-4 w-4" />
                  Webcam Viewer
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="icon" title="User Info">
              <Link to="/user-info">
                <User className="h-4 w-4" />
              </Link>
            </Button>
          </nav>
          <TrailMapDialog 
            open={trailMapOpen} 
            onOpenChange={setTrailMapOpen} 
            mapType={mapType}
          />
        </div>
      </div>
    </header>
  );
};
