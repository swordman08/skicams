import { Button } from "@/components/ui/button";
import { TIME_SLOTS } from "@/types/webcam";
import { Clock } from "lucide-react";

interface TimeSlotSelectorProps {
  selectedTime: string;
  onTimeSelect: (time: string) => void;
}

export const TimeSlotSelector = ({ selectedTime, onTimeSelect }: TimeSlotSelectorProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Select Time</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {TIME_SLOTS.map((slot) => (
          <Button
            key={slot.time}
            variant={selectedTime === slot.time ? "default" : "outline"}
            onClick={() => onTimeSelect(slot.time)}
            className="w-full text-xs sm:text-sm px-2 sm:px-4"
          >
            {slot.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
