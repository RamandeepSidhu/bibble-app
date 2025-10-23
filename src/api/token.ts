
import { ConfigValue } from '@/config';
import Cookies from 'js-cookie';
import { getSession } from 'next-auth/react';

export const AUTH_TOKEN_KEY = ConfigValue.AUTH_TOKEN_KEY;
export const CORDINATE = "CORDINATE";
export const IP_ADDRESS_STORAGE = "IP_ADDRESS";
export const BROWSER_STORAGE = "BROWSER";
export const OS_STORAGE = "OS";
export const CITY_STORAGE = "CITY";
export const COUNTRY_STORAGE = "COUNTRY";
export const DEVICE_STORAGE = "DEVICE";
export const DEVICE_ANALYTICS_STORAGE = "DEVICE_ANALYTICS";


export const getAuthToken = async () => {
  if (typeof window === undefined) {
    return null;
  }

  // First try to get token from cookies
  const cookieToken = Cookies.get(AUTH_TOKEN_KEY);
  if (cookieToken) {
    return cookieToken;
  }

  // When cookieToken is null, get token from NextAuth session
  try {
    const session = await getSession();
    if (session?.user && 'token' in session.user) {
      const sessionToken = (session.user as any).token;
      if (sessionToken) {
        // Update cookie with session token for future use
        setAuthToken(sessionToken);
        return sessionToken; // Return session token when cookie is null
      }
    }
  } catch (error) {
    console.warn('Failed to get session token:', error);
  }

  return null;
};

export function setAuthToken(token: string) {
  Cookies.set(AUTH_TOKEN_KEY, token, {
    expires: 365 // 365 days
  });
}


export function removeAuthToken() {
  Cookies.remove(AUTH_TOKEN_KEY);
}

export const getLocalStorage = async (KEY:string) => {
  if (typeof window === undefined) {
    return null;
  }
  return  Cookies.get(KEY);
}
