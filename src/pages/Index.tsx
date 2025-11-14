import { useState } from "react";
import { Header } from "@/components/Header";
import { DateSelector } from "@/components/DateSelector";
import { TimeSlotSelector } from "@/components/TimeSlotSelector";
import { WebcamCard } from "@/components/WebcamCard";
import { generateMockSnapshots } from "@/data/mockData";
import { format } from "date-fns";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("10:30");

  const snapshots = generateMockSnapshots(selectedDate, selectedTime);

  return (
    <div className="min-h-screen bg-gradient-to-b from-mountain-sky to-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Webcam History</h2>
          <p className="text-muted-foreground">
            View historical snapshots from Crystal Mountain's webcams
          </p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {snapshots.map((snapshot) => (
            <WebcamCard
              key={snapshot.id}
              snapshot={snapshot}
              date={format(selectedDate, "yyyy-MM-dd")}
              time={selectedTime}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
