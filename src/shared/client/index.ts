import { API_ENDPOINTS } from "@/api/endpoints";
import { HttpClient } from "./http-client";
const {
  LOGIN,
  ADMIN_DASHBOARD,
  ADD_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
  GET_PRODUCT_BY_ID,
  CHANGE_PRODUCT_STATUS,
  ADD_HYMN,
  UPDATE_HYMN,
  DELETE_HYMN,
  GET_HYMN_BY_ID,
  GET_HYMNS_BY_PRODUCT,
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
    updateProduct: (id: string, payload: any) =>
      HttpClient.put(UPDATE_PRODUCT.replace('{id}', id), payload),
    deleteProduct: (id: string) =>
      HttpClient.delete(DELETE_PRODUCT.replace('{id}', id)),
    getProductById: (id: string) =>
      HttpClient.get(GET_PRODUCT_BY_ID.replace('{id}', id)),
    changeProductStatus: (id: string, payload: any) =>
      HttpClient.post(CHANGE_PRODUCT_STATUS.replace('{id}', id), payload),
    getProducts: (params?: any) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
      return HttpClient.get(GET_PRODUCTS + queryString);
    },
    createHymn: (payload: any) =>
      HttpClient.post(ADD_HYMN, payload),
    updateHymn: (id: string, payload: any) =>
      HttpClient.put(UPDATE_HYMN.replace('{id}', id), payload),
    deleteHymn: (id: string) =>
      HttpClient.delete(DELETE_HYMN.replace('{id}', id)),
    getHymnById: (id: string) =>
      HttpClient.get(GET_HYMN_BY_ID.replace('{id}', id)),
    getHymnsByProduct: (productId: string) =>
      HttpClient.get(GET_HYMNS_BY_PRODUCT.replace('{productId}', productId)),
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
