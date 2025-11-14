import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { DateSelector } from "@/components/DateSelector";
import { TimeSlotSelector } from "@/components/TimeSlotSelector";
import { WebcamCard } from "@/components/WebcamCard";
import { useWebcamData } from "@/hooks/useWebcamData";
import { Camera, RefreshCw } from "lucide-react";
import { format } from "date-fns";

const Index = () => {
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("10:30");
  const { data: snapshots = [], isLoading } = useWebcamData(selectedDate, selectedTime);

  // Handle URL parameters for deep linking from history page
  useEffect(() => {
    const dateParam = searchParams.get('date');
    const timeParam = searchParams.get('time');
    
    if (dateParam) {
      setSelectedDate(new Date(dateParam));
    }
    if (timeParam) {
      setSelectedTime(timeParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-mountain-sky to-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Webcam Viewer</h2>
            <p className="text-muted-foreground">
              View historical snapshots from Crystal Mountain's webcams
            </p>
          </div>
        </div>

        <div className="mb-8 space-y-6 bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">Select Date</span>
              <DateSelector
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>
          </div>
          
          <TimeSlotSelector
            selectedTime={selectedTime}
            onTimeSelect={setSelectedTime}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : snapshots.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No snapshots found</h3>
            <p className="text-muted-foreground">
              No webcam snapshots available for this date and time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {snapshots.map((snapshot: any) => (
              <WebcamCard
                key={snapshot.id}
                snapshot={{
                  id: snapshot.id,
                  cameraName: snapshot.camera.name,
                  timestamp: new Date(snapshot.captured_at),
                  imageUrl: snapshot.image_url,
                  resort: 'Crystal Mountain Washington',
                  description: snapshot.camera.description
                }}
                date={format(selectedDate, "yyyy-MM-dd")}
                time={selectedTime}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
