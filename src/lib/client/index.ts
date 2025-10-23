import { API_ENDPOINTS } from "@/api/endpoints";
import { HttpClient } from "./http-client";
const {
  LOGIN,
} = API_ENDPOINTS;
class Client {
  Auth = {
    Login: (payload: any) => HttpClient.post(LOGIN, payload),
  
  };
}

const ClientInstance = new Client();
export default ClientInstance;
