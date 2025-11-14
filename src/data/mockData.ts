import { WebcamSnapshot } from "@/types/webcam";

// Generate mock data for demonstration
export const generateMockSnapshots = (date: Date, timeSlot: string): WebcamSnapshot[] => {
  const cameras = ["Summit Cam", "Snow Stake", "Gold Hills", "Northway Lift Cam"];
  const [hours, minutes] = timeSlot.split(":").map(Number);
  
  const snapshotDate = new Date(date);
  snapshotDate.setHours(hours, minutes, 0, 0);
  
  return cameras.map((camera, index) => ({
    id: `${date.toISOString()}-${timeSlot}-${camera}`,
    cameraName: camera,
    timestamp: snapshotDate,
    imageUrl: `https://images.unsplash.com/photo-${1515438261181 + index}-1e62ba5a1e92?w=800&h=600&fit=crop&q=80`,
    resort: "Crystal Mountain",
  }));
};
