import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useVisitorTracking } from "./hooks/useVisitorTracking";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const History = lazy(() => import("./pages/History"));
const CameraDetail = lazy(() => import("./pages/CameraDetail"));
const UserInfo = lazy(() => import("./pages/UserInfo"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const VisitorTracker = ({ children }: { children: React.ReactNode }) => {
  useVisitorTracking();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <VisitorTracker>
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/history" element={<History />} />
              <Route path="/camera/:cameraName" element={<CameraDetail />} />
              <Route path="/user-info" element={<UserInfo />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </VisitorTracker>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
