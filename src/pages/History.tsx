import { useState } from "react";
import { Header } from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const History = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const itemsPerPage = 20;

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['all-snapshots', page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('snapshots')
        .select(`
          id,
          image_url,
          captured_at,
          time_slot,
          camera:cameras(
            id,
            name,
            slug,
            description,
            elevation_ft
          )
        `)
        .order('captured_at', { ascending: false })
        .range(page * itemsPerPage, (page + 1) * itemsPerPage - 1);

      if (error) throw error;
      return data;
    },
  });

  const handleImageClick = (snapshot: any) => {
    const dateStr = format(new Date(snapshot.captured_at), 'yyyy-MM-dd');
    const timeSlot = snapshot.time_slot;
    navigate(`/?date=${dateStr}&time=${timeSlot.replace(' ', '+')}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-mountain-sky to-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Complete History</h2>
          <p className="text-muted-foreground">
            Browse all captured webcam snapshots from Crystal Mountain
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : snapshots.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No snapshots found</h3>
            <p className="text-muted-foreground">
              No webcam snapshots available yet.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {snapshots.map((snapshot: any) => (
                <Card 
                  key={snapshot.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleImageClick(snapshot)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={snapshot.image_url}
                        alt={`${snapshot.camera.name} - ${format(new Date(snapshot.captured_at), 'MMM d, yyyy')}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {snapshot.camera.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(snapshot.captured_at), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {snapshot.time_slot}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <Button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                variant="outline"
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page + 1}
              </span>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={snapshots.length < itemsPerPage}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default History;
