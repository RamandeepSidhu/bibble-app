import { NextRequest, NextResponse } from "next/server";
import { getCompleteGeoData, extractIpFromHeaders } from "@/lib/geo-api";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const cookieOptions = {
    path: "/",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24, // 24 hours
  };

  // Extract IP from headers (no static fallback)
  const ip = extractIpFromHeaders(req);

  // Detect browser and OS from user agent
  const userAgent = req.headers.get("user-agent") || "";

  const browser =
    userAgent.includes("Chrome") ? "Chrome" :
    userAgent.includes("Firefox") ? "Firefox" :
    userAgent.includes("Safari") && !userAgent.includes("Chrome") ? "Safari" :
    userAgent.includes("Edg") ? "Edge" :
    "Unknown";

  const os =
    userAgent.includes("Windows") ? "Windows" :
    userAgent.includes("Mac OS") ? "Mac OS" :
    userAgent.includes("Linux") ? "Linux" :
    userAgent.includes("Android") ? "Android" :
    userAgent.includes("iPhone") || userAgent.includes("iPad") ? "iOS" :
    "Unknown";

  const device =
    /mobile|iphone|ipod|android|phone/i.test(userAgent)
      ? "Mobile"
      : /ipad|tablet/i.test(userAgent)
      ? "Tablet"
      : "Desktop/Laptop";

    let country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    null;

    let city =
    req.headers.get("x-vercel-ip-city") ||
    req.headers.get("cf-city") ||
    null;

  let regionName: string | null = null;
  // Use country code from edge headers if available (cf-ipcountry is already a code)
  let countryCode: string | null =
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    null;
  let lat: number | null =  null;
  let lon: number | null = null;
 if ((!country || !city)) {
    try {
      let result: { ip: string | null; geoData: any } | null = null;
      if (ip) {
        result = await getCompleteGeoData(ip);
      } else {
        try {
          const geoApiUrl = `http://ip-api.com/json/?fields=status,country,countryCode,city,regionName,lat,lon`;
          const geoResponse = await fetch(geoApiUrl, {
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
          });
          
          if (geoResponse.ok) {
            const data = await geoResponse.json();
            console.log('[Middleware] ip-api.com raw data:', data);
            if (data.status === "success") {
              const geoData:any = {
                status: data.status,
                country: data.country || "Unknown",
                countryCode: data.countryCode || null,
                region: null,
                regionName: data.regionName || null,
                city: data.city || "Unknown",
                zip: null,
                lat: data.lat || null,
                lon: data.lon || null,
                timezone: null,
                isp: null,
                org: null,
                as: null,
                query: "",
              };
              
              // Always enhance with Mapbox if coordinates exist
              // Mapbox will give accurate location based on coordinates
              if (geoData.lat && geoData.lon) {   
                try {
                  const { enhanceGeoDataWithMapbox } = await import("@/lib/geo-api");
                  const enhanced = await enhanceGeoDataWithMapbox(geoData);
                  result = { ip: null, geoData: enhanced };
                } catch (mapboxError) {
                  result = { ip: null, geoData };
                }
              } 
            }
          }
        } catch (fallbackError) {
          console.error("[Middleware] Fallback API error:", fallbackError);
        }
      }            
  if (result?.geoData) {
        const { country: apiCountry, city: apiCity, regionName: apiRegion, countryCode: apiCountryCode, lat: apiLat, lon: apiLon } = result.geoData;
        if (apiCountry && apiCity) {
          country = apiCountry;
          city = apiCity;
          regionName = apiRegion || null;
          countryCode = apiCountryCode || countryCode || null;
          lat = apiLat || null;
          lon = apiLon || null;
        } else {
          country = country || apiCountry || "Unknown";
          city = city || apiCity || "Unknown";
          regionName = apiRegion || null;
          countryCode = apiCountryCode || countryCode || null;
          lat = apiLat || null;
          lon = apiLon || null;
        }
       
      }
    } catch (error) {
      console.error("[Middleware] Error fetching geo data:", error);
    }
  }

  // Set default values if still missing
  if (!country) country = "Unknown";
  if (!city) city = "Unknown";

  // Set all cookies
  res.cookies.set("BROWSER", browser, cookieOptions);
  res.cookies.set("OS", os, cookieOptions);
  res.cookies.set("DEVICE", device, cookieOptions);
  res.cookies.set("COUNTRY", country, cookieOptions);
  res.cookies.set("CITY", city, cookieOptions);
  res.cookies.set("COUNTRY_CODE", countryCode || "", cookieOptions);
  if (regionName) {
    res.cookies.set("REGION", regionName, cookieOptions);
  }
  if (lat) {
    res.cookies.set("LAT", lat.toString(), cookieOptions);
  }
  if (lon) {
    res.cookies.set("LON", lon.toString(), cookieOptions);
  }

  // Set analytics
  const analytics = {
    ipAddress: ip || null,
    browser,
    device,
    os,
    geo: { city, country },
  };
  res.cookies.set("DEVICE_ANALYTICS", JSON.stringify(analytics), cookieOptions);

  return res;
}

