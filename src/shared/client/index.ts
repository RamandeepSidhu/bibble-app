import { API_ENDPOINTS } from "@/api/endpoints";
import { HttpClient } from "./http-client";
const {
  LOGIN,
  ADD_PRODUCT,
  LANGUAGES,
  GET_LANGUAGE_CODE
} = API_ENDPOINTS;
class Client {
  Auth = {
    Login: (payload: any) => HttpClient.post(LOGIN, payload),
  };
 APP = {
    createProduct: (payload: any) =>
      HttpClient.post(ADD_PRODUCT, payload),
    getProducts: () => HttpClient.get(`list/product`),
    getLanguage: () => HttpClient.get(LANGUAGES),
    getLanguageCode: () => HttpClient.get(GET_LANGUAGE_CODE),
    getBioProfileById: (id: string) => HttpClient.get(`/${id}`),
  }
}

const ClientInstance = new Client();
export default ClientInstance;
