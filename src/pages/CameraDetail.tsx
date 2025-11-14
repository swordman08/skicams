import { useParams, useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Calendar, Clock } from "lucide-react";
import { generateMockSnapshots } from "@/data/mockData";
import { format, parse } from "date-fns";

const CameraDetail = () => {
  const { cameraName } = useParams();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");

  const date = dateParam ? parse(dateParam, "yyyy-MM-dd", new Date()) : new Date();
  const time = timeParam || "10:30";

  const snapshots = generateMockSnapshots(date, time);
  const snapshot = snapshots.find(
    (s) => s.cameraName === decodeURIComponent(cameraName || "")
  );

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-mountain-sky to-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Camera not found</p>
          <Link to="/">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Gallery
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-mountain-sky to-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Link to={`/?date=${dateParam}&time=${timeParam}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Gallery
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border">
              <div className="aspect-[16/9] bg-muted">
                <img
                  src={snapshot.imageUrl}
                  alt={snapshot.cameraName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {snapshot.cameraName}
                </h1>
                <p className="text-muted-foreground">{snapshot.resort}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <h2 className="font-semibold text-lg mb-4 text-foreground">Snapshot Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(snapshot.timestamp, "PPPP")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {snapshot.timestamp.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Image
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CameraDetail;
