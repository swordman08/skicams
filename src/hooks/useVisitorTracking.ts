import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface LocationData {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  timezone: string;
  org: string;
}

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("visitor_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("visitor_session_id", sessionId);
  }
  return sessionId;
};

const maskIP = (ip: string): string => {
  if (!ip) return null;
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

const parseUserAgent = () => {
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

  return { browser, os, device };
};

export const useVisitorTracking = () => {
  const location = useLocation();
  const hasTrackedRef = useRef<Set<string>>(new Set());
  const locationDataRef = useRef<LocationData | null>(null);

  useEffect(() => {
    // Fetch location data once per session
    const fetchLocationData = async () => {
      if (locationDataRef.current) return;
      
      try {
        const response = await fetch("https://ipapi.co/json/");
        if (response.ok) {
          locationDataRef.current = await response.json();
        }
      } catch (error) {
        console.error("Failed to fetch location data:", error);
      }
    };

    fetchLocationData();
  }, []);

  useEffect(() => {
    const trackVisit = async () => {
      const sessionId = getSessionId();
      const pageKey = `${sessionId}-${location.pathname}`;
      
      // Don't track the same page twice in the same session
      if (hasTrackedRef.current.has(pageKey)) return;
      hasTrackedRef.current.add(pageKey);

      const deviceInfo = parseUserAgent();
      const locationData = locationDataRef.current;

      const visitorData = {
        session_id: sessionId,
        ip_partial: locationData ? maskIP(locationData.ip) : null,
        city: locationData?.city || null,
        region: locationData?.region || null,
        country: locationData?.country_name || null,
        timezone: locationData?.timezone || null,
        isp: locationData?.org || null,
        browser: deviceInfo.browser,
        operating_system: deviceInfo.os,
        device_type: deviceInfo.device,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        page_path: location.pathname,
        referrer: document.referrer || null,
      };

      try {
        const { error } = await supabase
          .from("visitor_logs")
          .insert(visitorData);

        if (error) {
          console.error("Failed to log visitor:", error);
        }
      } catch (error) {
        console.error("Failed to log visitor:", error);
      }
    };

    // Small delay to allow location data to load
    const timer = setTimeout(trackVisit, 1000);
    return () => clearTimeout(timer);
  }, [location.pathname]);
};
