import { useState } from "react";
import { Mountain, History as HistoryIcon, Map, User, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrailMapDialog } from "@/components/TrailMapDialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Header = () => {
  const location = useLocation();
  const isHistoryPage = location.pathname === "/history";
  const [trailMapOpen, setTrailMapOpen] = useState(false);
  const [mapType, setMapType] = useState<"winter" | "northway">("winter");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openTrailMap = (type: "winter" | "northway") => {
    setMapType(type);
    setTrailMapOpen(true);
    setMobileMenuOpen(false);
  };

  const NavItems = () => (
    <>
      <Button 
        variant="outline" 
        className="gap-2 w-full sm:w-auto justify-start sm:justify-center"
        onClick={() => openTrailMap("winter")}
      >
        <Map className="h-4 w-4" />
        Trail Map
      </Button>
      <Button 
        variant="outline" 
        className="gap-2 w-full sm:w-auto justify-start sm:justify-center"
        onClick={() => openTrailMap("northway")}
      >
        <Map className="h-4 w-4" />
        Northway
      </Button>
      {!isHistoryPage ? (
        <Button asChild variant="outline" className="gap-2 w-full sm:w-auto justify-start sm:justify-center">
          <Link to="/history" onClick={() => setMobileMenuOpen(false)}>
            <HistoryIcon className="h-4 w-4" />
            Full History
          </Link>
        </Button>
      ) : (
        <Button asChild variant="outline" className="gap-2 w-full sm:w-auto justify-start sm:justify-center">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <Mountain className="h-4 w-4" />
            Webcam Viewer
          </Link>
        </Button>
      )}
      <Button asChild variant="ghost" size="icon" title="User Info" className="w-full sm:w-auto">
        <Link to="/user-info" onClick={() => setMobileMenuOpen(false)}>
          <User className="h-4 w-4" />
        </Link>
      </Button>
    </>
  );

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Mountain className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-foreground truncate">Crystal Mountain Cams</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Webcam History Tracker</p>
            </div>
          </Link>
          
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            <NavItems />
          </nav>

          {/* Mobile hamburger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-12">
              <nav className="flex flex-col gap-3">
                <NavItems />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <TrailMapDialog 
        open={trailMapOpen} 
        onOpenChange={setTrailMapOpen} 
        mapType={mapType}
      />
    </header>
  );
};
