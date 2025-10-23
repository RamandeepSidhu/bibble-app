// Bibble Admin - TypeScript Interfaces for Multilingual Content Management

export interface MultilingualText {
  en: string;
  sw: string;
  fr: string;
  rn: string;
}

export type ProductType = 'book' | 'story' | 'chapter' | 'verse' | 'hymns';

export interface Product {
  productId: string | null;
  type: ProductType;
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
  type: ProductType;
  title: MultilingualText;
  description: MultilingualText;
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

// Language options for forms
export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'sw', name: 'Swahili', flag: '🇹🇿' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'rn', name: 'Kinyarwanda', flag: '🇷🇼' }
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];

// Product 2 type options
export const PRODUCT_TYPES = [
  { value: 'book', label: 'Book', icon: '📖' },
  { value: 'hymns', label: 'Hymns', icon: '🎵' }
] as const;

// Content type options removed - admin can add all features
