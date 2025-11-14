import { Mountain } from "lucide-react";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Mountain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Crystal Mountain Cams</h1>
            <p className="text-sm text-muted-foreground">Webcam History Tracker</p>
          </div>
        </Link>
      </div>
    </header>
  );
};
