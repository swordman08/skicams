import { Button } from "@/components/ui/button";
import { TIME_SLOTS } from "@/types/webcam";
import { Clock } from "lucide-react";

interface TimeSlotSelectorProps {
  selectedTimes: string[];
  onTimesSelect: (times: string[]) => void;
}

export const TimeSlotSelector = ({ selectedTimes, onTimesSelect }: TimeSlotSelectorProps) => {
  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      // Don't allow deselecting the last one
      if (selectedTimes.length === 1) return;
      onTimesSelect(selectedTimes.filter(t => t !== time));
    } else {
      onTimesSelect([...selectedTimes, time]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Select Time(s)</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {TIME_SLOTS.map((slot) => (
          <Button
            key={slot.time}
            variant={selectedTimes.includes(slot.time) ? "default" : "outline"}
            onClick={() => toggleTime(slot.time)}
            className="w-full text-xs sm:text-sm px-2 sm:px-4"
          >
            {slot.label}
          </Button>
        ))}
      </div>
    </div>
  );
};