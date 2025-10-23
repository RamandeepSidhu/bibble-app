
import { signOut } from "next-auth/react";
import { client } from "./client";
import { Method } from "./methods";
import { showToast } from "@/lib/utils";
export const apiCall = async <T = any>(
    method: Method,
    url: string,
    data?: any,
    config: Record<string, any> = {}
): Promise<T> => {
    try {
        const response = await client.request<T>({
            method,
            url,
            ...(method === 'get' ? { params: data } : { data }),
            ...config,
        });
        return response.data;
    } catch (error: any) {
        // Log for debugging
        if (error?.response?.status === 500 || error?.response?.status === 422 || error?.response?.status === 401 || error?.response?.status === 404 || error?.response?.status === 400) {
            if(error.response && error.response.data && error.response.data.token === false){
                showToast('Failed',error.response?.data?.error?.message,"destructive");
                localStorage.clear();
                await signOut({redirect: true, callbackUrl: "/login"});
            }else if (error.response?.data?.error?.message) {
                showToast('Failed',error.response?.data?.error?.message,"destructive");
            }else if(error?.response && error?.response.data && error?.response.data.message){
                showToast('Failed',error.response?.data?.message,"destructive");
            }
        } else {
            showToast('Failed','Something went wrong!','destructive');
        }
        // Re-throw so React Query can catch it in `onError`
        throw error;
    }
};