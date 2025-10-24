// Bibble Admin - TypeScript Interfaces for Multilingual Content Management

export interface Language {
  code: string;
  name: string;
  flag?: string;
}

export interface MultilingualText {
  [languageCode: string]: string;
}

// Dynamic multilingual text type factory
export type DynamicMultilingualText<T extends Language[]> = {
  [K in T[number]['code']]: string;
};


export interface Product {
  productId: string | null;
  type: any;
  categoryId?: string;
  tags: string[];
  title: MultilingualText;
  description: MultilingualText;
  producer: string;
  profile_image?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  status?: 'active' | 'inactive' | 'draft';
}

export interface Story {
  storyId?: string;
  productId: string;
  title: MultilingualText;
  description: MultilingualText;
  order: number;
  createdAt?: string;
  updatedAt?: string;
  status?: 'active' | 'inactive' | 'draft';
}

export interface Chapter {
  chapterId?: string;
  storyId: string;
  title: MultilingualText;
  order: number;
  createdAt?: string;
  updatedAt?: string;
  status?: 'active' | 'inactive' | 'draft';
}

export interface Verse {
  verseId?: string;
  chapterId: string;
  number: number;
  text: MultilingualText;
  createdAt?: string;
  updatedAt?: string;
  status?: 'active' | 'inactive' | 'draft';
}

export interface Category {
  categoryId: string;
  name: MultilingualText;
  description: MultilingualText;
  parentId?: string;
  order: number;
  status: 'active' | 'inactive';
}

export interface UserSubscription {
  userId: string;
  subscriptionId: string;
  plan: 'free' | 'premium' | 'royal';
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod: string;
  amount: number;
  currency: string;
}

export interface AdminUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  subscription?: UserSubscription;
  createdAt: string;
  lastLogin?: string;
  totalProducts: number;
  totalStories: number;
  totalChapters: number;
  totalVerses: number;
}

// Form interfaces for creating/editing content
export interface ProductFormData {
  type: any;
  title: MultilingualText;
  description: MultilingualText;
  contentType:any,  // 'free' | 'paid';
  freePages: number;
}

export interface StoryFormData {
  productId: string;
  title: MultilingualText;
  description: MultilingualText;
  order: number;
}

export interface ChapterFormData {
  storyId: string;
  title: MultilingualText;
  order: number;
}

export interface VerseFormData {
  chapterId: string;
  number: number;
  text: MultilingualText;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Language options for forms (fallback until API loads)
export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'sw', name: 'Swahili', flag: '🇹🇿' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'rn', name: 'Kinyarwanda', flag: '🇷🇼' }
];

export type LanguageCode = Language['code'];

// Language Management Types
export interface LanguageManagement {
  _id: string;
  name: string;
  code: string;
  symbol: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLanguagePayload {
  name: string;
  code: string;
  symbol: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export interface UpdateLanguagePayload {
  name: string;
  code: string;
  symbol: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export interface LanguageApiResponse {
  success: boolean;
  data: LanguageManagement | LanguageManagement[] | {};
  message: string;
}

// Product 2 type options
export const PRODUCT_TYPES = [
  { value: 'book', label: 'Book', icon: '📖' },
  { value: 'song', label: 'Hymns', icon: '🎵' }
] as const;

// Product Management Types
export interface ProductManagement {
  _id: string;
  productId?: string;
  type: string;
  title: MultilingualText;
  description: MultilingualText;
  contentType: string;
  freePages?: number;
  views?: number;
  shares?: number;
  status: 'active' | 'inactive' | 'draft';
  createdAt?: string;
  updatedAt?: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface CreateProductPayload {
  productId?: string; // For updates
  type: string;
  title: MultilingualText;
  description: MultilingualText;
  contentType: string;
  freePages?: number;
}

export interface UpdateProductPayload {
  type: string;
  title: MultilingualText;
  description: MultilingualText;
  contentType: string;
  freePages?: number;
}

export interface ChangeProductStatusPayload {
  status: 'active' | 'inactive' | 'draft';
}

export interface ProductApiResponse {
  success: boolean;
  data: ProductManagement | ProductManagement[] | {};
  message: string;
}

// Hymn Management Types
export interface HymnManagement {
  _id: string;
  productId: string;
  number: number;
  text: MultilingualText;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHymnPayload {
  productId: string;
  number: number;
  text: MultilingualText;
}

export interface UpdateHymnPayload {
  number: number;
  text: MultilingualText;
}

export interface HymnApiResponse {
  success: boolean;
  data: HymnManagement | HymnManagement[] | {};
  message: string;
}

// Content type options removed - admin can add all features
