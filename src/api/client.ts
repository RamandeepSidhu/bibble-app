import axios from 'axios';
import { getAuthToken, removeAuthToken } from './token';
import { showToast } from '@/lib/toast';
import { signOut } from 'next-auth/react';
const Axios = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT}`,
  timeout: 150000000,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }
});
// Change request data/error here
Axios.interceptors.request.use(
  async (config: any) => {
    const token = await getAuthToken();
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

Axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle token expiration/invalid token
      if (
        status === 401 ||
        status === 403)
       {
        const errorMessage = data?.message || data?.error?.message || "Token is invalid or expired";

        showToast.error("Session Expired", errorMessage);
        // Clear auth token
        removeAuthToken();
        // Clear localStorage if it exists
        if (typeof window !== 'undefined') {
          localStorage.clear();
        }
        // Sign out using NextAuth
        await signOut({ 
          redirect: true, 
          callbackUrl: "/auth/login" 
        });
      }
    }
    return Promise.reject(error);
  }
);

export const client = Axios;
