export const API_ENDPOINTS = {
  LOGIN: "auth/login",
  ADMIN_DASHBOARD:"admin",
  GET_PRODUCTS:"admin/products",
  ADD_PRODUCT: "admin/product",
  UPDATE_PRODUCT: "admin/product/{id}",
  DELETE_PRODUCT: "admin/product/{id}",
  GET_PRODUCT_BY_ID: "admin/product/{id}",
  CHANGE_PRODUCT_STATUS: "admin/change-product-status/{id}",
  ADD_HYMN:"admin/hymn",
  UPDATE_HYMN:"admin/hymn/{id}",
  DELETE_HYMN:"admin/hymn/{id}",
  GET_HYMN_BY_ID:"admin/hymn/{id}",
  GET_HYMNS_BY_PRODUCT:"admin/hymns/{productId}",
  // Stories API endpoints
  ADD_STORY: "admin/story",
  UPDATE_STORY: "admin/story/{id}",
  DELETE_STORY: "admin/story/{id}",
  GET_STORY_BY_ID: "admin/story/{id}",
  GET_STORIES_BY_PRODUCT: "admin/stories/{productId}",
  CHANGE_STORY_STATUS: "admin/change-story-status/{id}",
  
  // Chapters API endpoints
  ADD_CHAPTER: "admin/chapter",
  UPDATE_CHAPTER: "admin/chapter/{id}",
  DELETE_CHAPTER: "admin/chapter/{id}",
  GET_CHAPTER_BY_ID: "admin/chapter/{id}",
  GET_CHAPTERS_BY_STORY: "admin/chapters/{storyId}",
  
  // Verses API endpoints
  ADD_VERSE: "admin/verse",
  UPDATE_VERSE: "admin/verse/{id}",
  DELETE_VERSE: "admin/verse/{id}",
  GET_VERSE_BY_ID: "admin/verse/{id}",
  GET_VERSES_BY_CHAPTER: "admin/verses/{chapterId}",
  
  // Language endpoints
  LANGUAGES: "admin/languages",
  CREATE_LANGUAGES: "admin/languages",
  GET_LANGUAGE_CODE: "admin/languages/codes",
  UPDATE_LANGUAGE: "admin/languages/{id}",
  DELETE_LANGUAGE: "admin/languages/{id}",
  GET_LANGUAGE_BY_ID: "admin/languages/{id}",
};