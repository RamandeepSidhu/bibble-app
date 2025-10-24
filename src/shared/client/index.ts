import { API_ENDPOINTS } from "@/api/endpoints";
import { HttpClient } from "./http-client";
const {
  LOGIN,
  ADMIN_DASHBOARD,
  ADD_PRODUCT,
  LANGUAGES,
  GET_PRODUCTS,
  GET_LANGUAGE_CODE,
  UPDATE_LANGUAGE,
  CREATE_LANGUAGES,
  GET_LANGUAGE_BY_ID,
  DELETE_LANGUAGE,  
} = API_ENDPOINTS;
class Client {
  Auth = {
    Login: (payload: any) => HttpClient.post(LOGIN, payload),
  };
 APP = {
    createProduct: (payload: any) =>
      HttpClient.post(ADD_PRODUCT, payload),
    getProducts: () => HttpClient.get(GET_PRODUCTS),
    getLanguage: () => HttpClient.get(LANGUAGES),
    getLanguageCode: () => HttpClient.get(GET_LANGUAGE_CODE),
    CreateLanguage: (payload: any) => HttpClient.post(CREATE_LANGUAGES, payload),
    UpdateLanguage: (id: string, payload: any) => HttpClient.put(UPDATE_LANGUAGE.replace('{id}', id), payload),
    DeleteLanguage: (id: string) => HttpClient.delete(DELETE_LANGUAGE.replace('{id}', id)),
    GetLanguageById: (id: string) => HttpClient.get(GET_LANGUAGE_BY_ID.replace('{id}', id)),
    getBioProfileById: (id: string) => HttpClient.get(`/${id}`),
    getAdminDashboard: () => HttpClient.get(ADMIN_DASHBOARD),
  }
}

const ClientInstance = new Client();
export default ClientInstance;
