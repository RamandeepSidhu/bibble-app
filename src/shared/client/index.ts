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
  // Story endpoints
  ADD_STORY,
  UPDATE_STORY,
  DELETE_STORY,
  GET_STORY_BY_ID,
  GET_STORIES_BY_PRODUCT,
  // Chapter endpoints
  ADD_CHAPTER,
  UPDATE_CHAPTER,
  DELETE_CHAPTER,
  GET_CHAPTER_BY_ID,
  GET_CHAPTERS_BY_STORY,
  // Verse endpoints
  ADD_VERSE,
  UPDATE_VERSE,
  DELETE_VERSE,
  GET_VERSE_BY_ID,
  GET_VERSES_BY_CHAPTER,
  USER_LIST,
  UPLOAD_CSV,
  CSV_VALIDATION,
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
    
    // Story methods
    createStory: (payload: any) => HttpClient.post(ADD_STORY, payload),
    updateStory: (id: string, payload: any) => HttpClient.put(UPDATE_STORY.replace('{id}', id), payload),
    deleteStory: (id: string) => HttpClient.delete(DELETE_STORY.replace('{id}', id)),
    getStoryById: (id: string) => {
      const url = GET_STORY_BY_ID.replace('{id}', id);
      return HttpClient.get(url);
    },
    getStoriesByProduct: (productId: string) => HttpClient.get(GET_STORIES_BY_PRODUCT.replace('{productId}', productId)),
    
    // Chapter methods
    createChapter: (payload: any) => HttpClient.post(ADD_CHAPTER, payload),
    updateChapter: (id: string, payload: any) => HttpClient.put(UPDATE_CHAPTER.replace('{id}', id), payload),
    deleteChapter: (id: string) => HttpClient.delete(DELETE_CHAPTER.replace('{id}', id)),
    getChapterById: (id: string) => {
      const url = GET_CHAPTER_BY_ID.replace('{id}', id);
      return HttpClient.get(url);
    },
    getChaptersByStory: (storyId: string) => HttpClient.get(GET_CHAPTERS_BY_STORY.replace('{storyId}', storyId)),
    
    // Verse methods
    createVerse: (payload: any) => HttpClient.post(ADD_VERSE, payload),
    updateVerse: (id: string, payload: any) => HttpClient.put(UPDATE_VERSE.replace('{id}', id), payload),
    deleteVerse: (id: string) => HttpClient.delete(DELETE_VERSE.replace('{id}', id)),
    getVerseById: (id: string) => {
      const url = GET_VERSE_BY_ID.replace('{id}', id);
      return HttpClient.get(url);
    },
    getVersesByChapter: (chapterId: string) => HttpClient.get(GET_VERSES_BY_CHAPTER.replace('{chapterId}', chapterId)),
    getUserList: (params?: string) => {
      const queryString = params ? `?${params}` : '';
      return HttpClient.get(USER_LIST + queryString);
    },

    // CSV Upload
    uploadCsv: (productId: string, file: File) => {
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('file', file);
      return HttpClient.post(UPLOAD_CSV, formData);
    },
    validateCsv: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return HttpClient.post(CSV_VALIDATION, formData);
    },
  }
}

const ClientInstance = new Client();
export default ClientInstance;
