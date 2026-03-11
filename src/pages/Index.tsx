import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { DateSelector } from "@/components/DateSelector";
import { TimeSlotSelector } from "@/components/TimeSlotSelector";
import { WebcamCard } from "@/components/WebcamCard";
import { useWebcamData } from "@/hooks/useWebcamData";
import { Camera, RefreshCw, Github, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const TIME_ORDER = ["7:30 AM", "12:00 PM", "3:30 PM"];

const Index = () => {
  const [searchParams] = useSearchParams();
  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(["10:30"]);
  const [newestFirst, setNewestFirst] = useState(true);
  const { data: snapshots = [], isLoading } = useWebcamData(selectedDates, selectedTimes);

  useEffect(() => {
    const dateParam = searchParams.get('date');
    const timeParam = searchParams.get('time');
    
    if (dateParam) {
      setSelectedDates([new Date(dateParam)]);
    }
    if (timeParam) {
      setSelectedTimes([timeParam]);
    }
  }, [searchParams]);

  // Group snapshots: newest date first, then by time slot order within each date
  const groupedSnapshots = useMemo(() => {
    const groups: { date: string; timeSlot: string; snapshots: any[] }[] = [];
    const map = new Map<string, any[]>();

    for (const snap of snapshots) {
      const dateStr = format(new Date(snap.captured_at), 'yyyy-MM-dd');
      const key = `${dateStr}|${snap.time_slot}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(snap);
    }

    // Sort keys: date descending, then time slot by TIME_ORDER
    const sortedKeys = [...map.keys()].sort((a, b) => {
      const [dateA, timeA] = a.split('|');
      const [dateB, timeB] = b.split('|');
      const dateCompare = newestFirst ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
      if (dateA !== dateB) return dateCompare;
      const timeCompare = TIME_ORDER.indexOf(timeA) - TIME_ORDER.indexOf(timeB);
      return newestFirst ? timeCompare : -timeCompare;
    });

    for (const key of sortedKeys) {
      const [date, timeSlot] = key.split('|');
      groups.push({ date, timeSlot, snapshots: map.get(key)! });
    }

    return groups;
  }, [snapshots, newestFirst]);

  const showGroupHeaders = selectedDates.length > 1 || selectedTimes.length > 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-mountain-sky to-background">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8 space-y-2 sm:space-y-4">
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Webcam Viewer</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              View historical snapshots from Crystal Mountain's webcams
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Note: Crystal Mountain's power was out and they changed their webcams backend, so data is missing from December 9th-29th.
            </p>
          </div>
        </div>

        <div className="mb-4 sm:mb-8 space-y-4 sm:space-y-6 bg-card rounded-xl p-4 sm:p-6 shadow-sm border border-border">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted-foreground">Select Date(s)</span>
            <DateSelector
              selectedDates={selectedDates}
              onDatesSelect={(dates) => setSelectedDates(dates.length === 0 ? [new Date()] : dates)}
            />
          </div>
          
          <TimeSlotSelector
            selectedTimes={selectedTimes}
            onTimesSelect={setSelectedTimes}
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
            <p className="text-muted-foreground text-sm">
              No webcam snapshots available for the selected dates and times.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedSnapshots.map((group) => (
              <div key={`${group.date}-${group.timeSlot}`}>
                {showGroupHeaders && (
                  <h3 className="text-lg font-semibold text-foreground mb-3 border-b border-border pb-2">
                    {format(new Date(group.date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')} — {group.timeSlot}
                  </h3>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {group.snapshots.map((snapshot: any) => (
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
                      date={group.date}
                      time={snapshot.time_slot}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <a 
            href="https://swordman08.github.io/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Built by <Github className="h-3.5 w-3.5" /> <span className="underline">Decker</span>
          </a>
          <p className="text-xs text-muted-foreground">
            Webcam history powered by <a href="https://urlbox.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Urlbox</a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;