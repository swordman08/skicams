import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Monitor, Globe, Clock, Fingerprint } from "lucide-react";

interface LocationData {
  ip: string;
  city: string;
  region: string;
  country: string;
  timezone: string;
  org: string;
}

interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  screenResolution: string;
  language: string;
  cookiesEnabled: boolean;
  doNotTrack: boolean;
  touchSupport: boolean;
}

const maskIP = (ip: string): string => {
  if (!ip) return "Unknown";
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  // Handle IPv6
  if (ip.includes(":")) {
    const v6parts = ip.split(":");
    return `${v6parts.slice(0, 3).join(":")}:****:****`;
  }
  return ip.slice(0, Math.floor(ip.length / 2)) + "****";
};

const parseUserAgent = (): DeviceInfo => {
  const ua = navigator.userAgent;
  
  // Detect browser
  let browser = "Unknown";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Microsoft Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  // Detect OS
  let os = "Unknown";
  if (ua.includes("Windows NT 10")) os = "Windows 10/11";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  // Detect device type
  let device = "Desktop";
  if (/Mobi|Android/i.test(ua)) device = "Mobile";
  else if (/Tablet|iPad/i.test(ua)) device = "Tablet";

  return {
    browser,
    os,
    device,
    screenResolution: `${window.screen.width} × ${window.screen.height}`,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === "1",
    touchSupport: "ontouchstart" in window,
  };
};

const UserInfo = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Parse device info immediately
    setDeviceInfo(parseUserAgent());

    // Fetch location data
    const fetchLocation = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("Failed to fetch location");
        const data = await response.json();
        setLocation({
          ip: data.ip,
          city: data.city,
          region: data.region,
          country: data.country_name,
          timezone: data.timezone,
          org: data.org,
        });
      } catch (err) {
        setError("Unable to fetch location data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">User Information</h1>
          <p className="text-muted-foreground">
            Information about your current session and device
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Location Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location
              </CardTitle>
              <CardDescription>Your approximate geographic location</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                </div>
              ) : error ? (
                <p className="text-muted-foreground">{error}</p>
              ) : location ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">City</span>
                    <span className="font-medium">{location.city || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Region</span>
                    <span className="font-medium">{location.region || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Country</span>
                    <span className="font-medium">{location.country || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">ISP</span>
                    <span className="font-medium text-right text-sm max-w-[200px] truncate">
                      {location.org || "Unknown"}
                    </span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Network Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Network
              </CardTitle>
              <CardDescription>Your network connection details</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                </div>
              ) : location ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">IP Address</span>
                    <Badge variant="secondary" className="font-mono">
                      {maskIP(location.ip)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Timezone</span>
                    <span className="font-medium">{location.timezone || "Unknown"}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Unable to fetch network info</p>
              )}
            </CardContent>
          </Card>

          {/* Device Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Device
              </CardTitle>
              <CardDescription>Your device and browser information</CardDescription>
            </CardHeader>
            <CardContent>
              {deviceInfo ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Browser</span>
                    <span className="font-medium">{deviceInfo.browser}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Operating System</span>
                    <span className="font-medium">{deviceInfo.os}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Device Type</span>
                    <Badge variant="outline">{deviceInfo.device}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Screen</span>
                    <span className="font-medium">{deviceInfo.screenResolution}</span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Session Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-primary" />
                Session Details
              </CardTitle>
              <CardDescription>Browser capabilities and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              {deviceInfo ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Language</span>
                    <span className="font-medium">{deviceInfo.language}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cookies</span>
                    <Badge variant={deviceInfo.cookiesEnabled ? "default" : "destructive"}>
                      {deviceInfo.cookiesEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Do Not Track</span>
                    <Badge variant={deviceInfo.doNotTrack ? "secondary" : "outline"}>
                      {deviceInfo.doNotTrack ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Touch Support</span>
                    <span className="font-medium">{deviceInfo.touchSupport ? "Yes" : "No"}</span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            This information is collected for analytics purposes to help improve our service.
          </p>
          <p className="text-xs text-muted-foreground">
            Privacy protections include IP masking and no personally identifiable information is shared.
          </p>
        </div>
      </main>
    </div>
  );
};

export default UserInfo;
