export interface WebcamSnapshot {
  id: string;
  cameraName: string;
  timestamp: Date;
  imageUrl: string;
  resort: string;
  description?: string;
}

export interface TimeSlot {
  time: string;
  label: string;
}

export const TIME_SLOTS: TimeSlot[] = [
  { time: "07:30", label: "7:30 AM" },
  { time: "12:00", label: "12:00 PM" },
  { time: "15:30", label: "3:30 PM" },
];

export const CRYSTAL_MOUNTAIN_CAMERAS = [
  "Summit Cam",
  "Snow Stake",
  "Gold Hills",
  "Northway Lift Cam",
];
