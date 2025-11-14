import { Mountain, History as HistoryIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const location = useLocation();
  const isHistoryPage = location.pathname === "/history";

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
          
          <nav className="flex items-center gap-4">
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
          </nav>
        </div>
      </div>
    </header>
  );
};
