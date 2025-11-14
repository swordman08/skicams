export interface WebcamSnapshot {
  id: string;
  cameraName: string;
  timestamp: Date;
  imageUrl: string;
  resort: string;
}

export interface TimeSlot {
  time: string;
  label: string;
}

export const TIME_SLOTS: TimeSlot[] = [
  { time: "07:30", label: "7:30 AM" },
  { time: "10:30", label: "10:30 AM" },
  { time: "13:30", label: "1:30 PM" },
  { time: "16:00", label: "4:00 PM" },
];

export const CRYSTAL_MOUNTAIN_CAMERAS = [
  "Summit Cam",
  "Snow Stake",
  "Gold Hills",
  "Northway Lift Cam",
];
