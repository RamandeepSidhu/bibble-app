/**
 * Geo-location and IP API utilities
 * Extracted from middleware for better code organization
 */

export interface GeoData {
  status: string;
  country: string;
  countryCode: string | null;
  region: string | null;
  regionName: string | null;
  city: string;
  zip: string | null;
  lat: number | null;
  lon: number | null;
  timezone: string | null;
  isp: string | null;
  org: string | null;
  as: string | null;
  query: string;
}

/**
 * Check if IP is localhost (should skip geo lookup)
 */
export function isLocalhost(ip: string | null): boolean {
  if (!ip) return true;
  
  // Localhost IPv4 and IPv6 only
  return ip === "127.0.0.1" || ip === "::1" || ip === "localhost";
}

/**
 * Extract IP address from request headers
 * Returns any IP (including private IPs) - only skips localhost
 */
export function extractIpFromHeaders(req: {
  headers: {
    get: (name: string) => string | null;
  };
}): string | null {
  // Try various headers in order of preference
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    const firstIp = ips[0] || null;
    // Only skip if it's localhost (allow private IPs)
    if (firstIp && !isLocalhost(firstIp)) {
      return firstIp;
    }
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp && !isLocalhost(realIp)) {
    return realIp;
  }

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp && !isLocalhost(cfConnectingIp)) {
    return cfConnectingIp;
  }

  return null;
}

/**
 * Fetch geo-location data from ip-api.com
 */
export async function fetchGeoData(ip: string): Promise<GeoData | null> {
  try {
    const geoApiUrl = `http://ip-api.com/json/${ip}`;
    const geoResponse = await fetch(geoApiUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    
    if (geoResponse.ok) {
      const data = await geoResponse.json();
      if (data.status === "success") {
        return {
          status: data.status,
          country: data.country || "Unknown",
          countryCode: data.countryCode || null,
          region: data.region || null,
          regionName: data.regionName || null,
          city: data.city || "Unknown",
          zip: data.zip || null,
          lat: data.lat || null,
          lon: data.lon || null,
          timezone: data.timezone || null,
          isp: data.isp || null,
          org: data.org || null,
          as: data.as || null,
          query: data.query || ip,
        };
      }
    }
  } catch (error) {
    console.error("[GeoAPI] Error fetching geo data:", error);
  }
  return null;
}

/**
 * Enhance geo data using Mapbox reverse geocoding
 * Gets country and city from coordinates using Mapbox API
 * Updates country and city fields with Mapbox data
 */
export async function enhanceGeoDataWithMapbox(
  geoData: GeoData
): Promise<GeoData> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX;
  
  if (!mapboxToken || !geoData.lat || !geoData.lon) {
    return geoData;
  }

  try {
    // Mapbox reverse geocoding: longitude,latitude (note: lon comes first!)
    // Note: When using multiple types, we cannot use limit parameter
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${geoData.lon},${geoData.lat}.json?access_token=${mapboxToken}&types=country,place,region`;
    
    const mapboxResponse = await fetch(mapboxUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (mapboxResponse.ok) {
      const mapboxData = await mapboxResponse.json();
      
      if (mapboxData.features && mapboxData.features.length > 0) {
        let country = geoData.country;
        let countryCode = geoData.countryCode;
        let city = geoData.city;
        let regionName = geoData.regionName;

        // Extract country and city from all features
        for (const feature of mapboxData.features) {
          const placeType = feature.place_type || [];
          
          // Extract country
          if (placeType.includes('country')) {
            country = feature.text || country;
            countryCode = feature.properties?.iso_3166_1?.toUpperCase() || 
                         feature.properties?.short_code?.toUpperCase() || 
                         countryCode;
          }
          
          // Extract city (place)
          if (placeType.includes('place') && !city) {
            city = feature.text || city;
          }
          
          // Extract region
          if (placeType.includes('region')) {
            regionName = feature.text || regionName;
          }
        }

        // Also check context array for country and city
        const mainFeature = mapboxData.features[0];
        if (mainFeature?.context) {
          for (const ctx of mainFeature.context) {
            if (ctx.id?.startsWith('country')) {
              country = ctx.text || country;
              countryCode = ctx.short_code?.toUpperCase() || countryCode;
            }
            if (ctx.id?.startsWith('place') && !city) {
              city = ctx.text || city;
            }
            if (ctx.id?.startsWith('region')) {
              regionName = ctx.text || regionName;
            }
          }
        }

        // Update geoData with Mapbox enhanced data (country and city)
        return {
          ...geoData,
          country: country || geoData.country,
          countryCode: countryCode || geoData.countryCode,
          city: city || geoData.city,
          regionName: regionName || geoData.regionName,
        };
      }
    }
  } catch (error) {
    console.error("[GeoAPI] Error enhancing with Mapbox:", error);
  }

  return geoData;
}

/**
 * Get country and city using Mapbox IP geocoding
 * Simplified - only returns country and city, no IP storage needed
 */
export async function getCountryAndCityFromMapbox(
  ip: string | null
): Promise<{ country: string; city: string; countryCode: string | null } | null> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX;
  
  if (!mapboxToken || !ip || ip === "Unknown" || isLocalhost(ip)) {
    return null;
  }

  try {
    // Mapbox IP geocoding API
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${ip}.json?access_token=${mapboxToken}&types=country,place&limit=5`;
    
    const mapboxResponse = await fetch(mapboxUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (mapboxResponse.ok) {
      const mapboxData = await mapboxResponse.json();
      
      if (mapboxData.features && mapboxData.features.length > 0) {
        let country = "Unknown";
        let countryCode: string | null = null;
        let city = "Unknown";

        // Extract country and city from Mapbox response
        for (const feature of mapboxData.features) {
          const placeType = feature.place_type || [];
          
          // Extract country
          if (placeType.includes('country')) {
            country = feature.text || country;
            countryCode = feature.properties?.iso_3166_1?.toUpperCase() || 
                         feature.properties?.short_code?.toUpperCase() || 
                         null;
          }
          
          // Extract city (place)
          if (placeType.includes('place') && city === "Unknown") {
            city = feature.text || city;
          }
        }

        // Also check context array
        const mainFeature = mapboxData.features[0];
        if (mainFeature?.context) {
          for (const ctx of mainFeature.context) {
            if (ctx.id?.startsWith('country')) {
              country = ctx.text || country;
              countryCode = ctx.short_code?.toUpperCase() || countryCode;
            }
            if (ctx.id?.startsWith('place') && city === "Unknown") {
              city = ctx.text || city;
            }
          }
        }

        console.log('[GeoAPI] Country and city from Mapbox:', country, city);
        return { country, city, countryCode };
      }
    }
  } catch (error) {
    console.error("[GeoAPI] Error getting country/city from Mapbox:", error);
  }

  return null;
}

/**
 * Get complete geo data (IP + location) in one call
 * IP is extracted from headers, uses direct external API (ip-api.com)
 * Always enhanced with Mapbox reverse geocoding to update country and city
 */
export async function getCompleteGeoData(
  ip: string | null
): Promise<{ ip: string | null; geoData: GeoData | null }> {
  let geoData: GeoData | null = null;

  // Get geo data using the provided IP (fetch for all IPs except localhost)
  if (ip && ip !== "Unknown" && !isLocalhost(ip)) {
    geoData = await fetchGeoData(ip);
    
    // Always enhance with Mapbox if available and we have coordinates
    // Mapbox will update country and city fields
    if (geoData && geoData.lat && geoData.lon) {
      geoData = await enhanceGeoDataWithMapbox(geoData);
      console.log('[GeoAPI] Country and city updated with Mapbox:', geoData.country, geoData.city);
    }
  } else if (isLocalhost(ip)) {
    console.log('[GeoAPI] Skipping geo lookup for localhost:', ip);
  }

  return { ip, geoData };
}

/**
 * Client-side: Get current location using browser geolocation API
 * Returns latitude and longitude
 * @param options - Optional geolocation options
 */
export async function getCurrentLocation(options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}): Promise<{
  lat: number;
  lon: number;
} | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    console.error('[GeoAPI] Geolocation is not available');
    return null;
  }

  const geolocationOptions = {
    enableHighAccuracy: options?.enableHighAccuracy ?? false, // Set to false for faster results
    timeout: options?.timeout ?? 20000, // Increased to 20 seconds
    maximumAge: options?.maximumAge ?? 60000, // Allow cached positions up to 1 minute old
  };

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Unknown error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'User denied the request for Geolocation';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out';
            // Try again with cached position allowed
            if (geolocationOptions.maximumAge === 0) {
              console.log('[GeoAPI] Retrying with cached position allowed...');
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                  });
                },
                (retryError) => {
                  console.error('[GeoAPI] Retry also failed:', retryError);
                  resolve(null);
                },
                {
                  ...geolocationOptions,
                  maximumAge: 300000, // Allow 5 minute old cached position
                  enableHighAccuracy: false,
                }
              );
              return;
            }
            break;
        }
        console.error(`[GeoAPI] Error getting current location (${error.code}):`, errorMessage);
        resolve(null);
      },
      geolocationOptions
    );
  });
}

/**
 * Get city, country, and other location data from coordinates using Mapbox reverse geocoding
 * Works on both client and server side
 */
export async function getLocationFromCoordinates(
  lat: number,
  lon: number
): Promise<{
  city: string;
  country: string;
  countryCode: string | null;
  regionName: string | null;
} | null> {
  // Access environment variable - NEXT_PUBLIC_ variables are available on client
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX;

  if (!mapboxToken) {
    console.error('[GeoAPI] Mapbox token not found. Make sure NEXT_PUBLIC_MAPBOX is set in .env.local');
    return null;
  }

  console.log('[GeoAPI] Fetching location from Mapbox for coordinates:', { lat, lon });

  try {
    // Mapbox reverse geocoding: longitude,latitude (note: lon comes first!)
    // Note: When using multiple types, we cannot use limit parameter
    // Remove limit or use single type. We'll get all results and filter.
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${mapboxToken}&types=country,place,region`;

    console.log('[GeoAPI] Calling Mapbox API...');
    const mapboxResponse = await fetch(mapboxUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000), // Increased timeout
    });

    console.log('[GeoAPI] Mapbox response status:', mapboxResponse.status);

    if (!mapboxResponse.ok) {
      const errorText = await mapboxResponse.text();
      console.error('[GeoAPI] Mapbox API error:', mapboxResponse.status, errorText);
      return null;
    }

    const mapboxData = await mapboxResponse.json();
    console.log('[GeoAPI] Mapbox response data:', mapboxData);

    if (!mapboxData.features || mapboxData.features.length === 0) {
      console.warn('[GeoAPI] No features found in Mapbox response');
      return null;
    }

    let country = 'Unknown';
    let countryCode: string | null = null;
    let city = 'Unknown';
    let regionName: string | null = null;

    // Extract country and city from all features
    for (const feature of mapboxData.features) {
      const placeType = feature.place_type || [];
      console.log('[GeoAPI] Processing feature:', feature.text, 'types:', placeType);

      // Extract country
      if (placeType.includes('country')) {
        country = feature.text || country;
        countryCode =
          feature.properties?.iso_3166_1?.toUpperCase() ||
          feature.properties?.short_code?.toUpperCase() ||
          null;
        console.log('[GeoAPI] Found country:', country, countryCode);
      }

      // Extract city (place) - prioritize place type
      if (placeType.includes('place')) {
        if (city === 'Unknown' || placeType.includes('city') || placeType.includes('town')) {
          city = feature.text || city;
          console.log('[GeoAPI] Found city:', city);
        }
      }

      // Extract region
      if (placeType.includes('region')) {
        regionName = feature.text || regionName;
        console.log('[GeoAPI] Found region:', regionName);
      }
    }

    // Also check context array for country and city
    const mainFeature = mapboxData.features[0];
    if (mainFeature?.context) {
      for (const ctx of mainFeature.context) {
        if (ctx.id?.startsWith('country')) {
          country = ctx.text || country;
          countryCode = ctx.short_code?.toUpperCase() || countryCode;
          console.log('[GeoAPI] Context country:', country, countryCode);
        }
        if (ctx.id?.startsWith('place') && city === 'Unknown') {
          city = ctx.text || city;
        }
        if (ctx.id?.startsWith('region')) {
          regionName = ctx.text || regionName;
          console.log('[GeoAPI] Context region:', regionName);
        }
      }
    }

    // If still unknown, try to get from locality or neighborhood
    if (city === 'Unknown' && mainFeature) {
      const placeType = mainFeature.place_type || [];
      if (placeType.includes('locality') || placeType.includes('neighborhood')) {
        city = mainFeature.text || city;
        console.log('[GeoAPI] Using locality/neighborhood as city:', city);
      }
    }

    console.log('[GeoAPI] Final location from coordinates:', {
      city,
      country,
      countryCode,
      regionName,
    });

    return { city, country, countryCode, regionName };
  } catch (error) {
    console.error('[GeoAPI] Error getting location from coordinates:', error);
    if (error instanceof Error) {
      console.error('[GeoAPI] Error details:', error.message, error.stack);
    }
    return null;
  }
}

/**
 * Client-side: Get current location (lat/lon) and city in one call
 * Uses browser geolocation API and Mapbox reverse geocoding
 */
export async function getCurrentLocationAndCity(): Promise<{
  lat: number;
  lon: number;
  city: string;
  country: string;
  countryCode: string | null;
  regionName: string | null;
} | null> {
  console.log('[GeoAPI] Starting getCurrentLocationAndCity...');
  
  // Get current location from browser
  const location = await getCurrentLocation();
  if (!location) {
    console.warn('[GeoAPI] Failed to get current location from browser');
    return null;
  }

  console.log('[GeoAPI] Got location coordinates:', location);

  // Get city and country from coordinates using Mapbox
  const locationData = await getLocationFromCoordinates(
    location.lat,
    location.lon
  );
  
  if (!locationData) {
    console.warn('[GeoAPI] Failed to get location data from Mapbox, but returning coordinates');
    // Return coordinates even if Mapbox fails
    return {
      lat: location.lat,
      lon: location.lon,
      city: 'Unknown',
      country: 'Unknown',
      countryCode: null,
      regionName: null,
    };
  }

  console.log('[GeoAPI] Successfully got location and city data');
  return {
    lat: location.lat,
    lon: location.lon,
    city: locationData.city,
    country: locationData.country,
    countryCode: locationData.countryCode,
    regionName: locationData.regionName,
  };
}

