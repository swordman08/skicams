import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  selectedDates: Date[];
  onDatesSelect: (dates: Date[]) => void;
}

export const DateSelector = ({ selectedDates, onDatesSelect }: DateSelectorProps) => {
  const label = selectedDates.length === 0
    ? "Pick dates"
    : selectedDates.length === 1
      ? format(selectedDates[0], "PPP")
      : `${selectedDates.length} dates selected`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full md:w-[280px] justify-start text-left font-normal",
            selectedDates.length === 0 && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="multiple"
          selected={selectedDates}
          onSelect={(dates) => onDatesSelect(dates || [])}
          disabled={(date) => date > new Date() || date < new Date("2024-01-01")}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
};