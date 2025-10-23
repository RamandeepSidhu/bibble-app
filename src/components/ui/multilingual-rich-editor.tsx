'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CKEditorComponent } from '@/components/ui/ckeditor';
import { MultilingualText, LANGUAGES } from '@/lib/types/bibble';
import { Eye, Edit3 } from 'lucide-react';

interface MultilingualRichEditorProps {
  label: string;
  value: MultilingualText;
  onChange: (value: MultilingualText) => void;
  placeholder?: string;
  type?: 'input' | 'textarea';
  rows?: number;
  required?: boolean;
}

export function MultilingualRichEditor({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 4,
  required = false
}: MultilingualRichEditorProps) {
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'sw' | 'fr' | 'rn'>('en');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Helper function to check if rich text content is actually empty
  const isRichTextEmpty = (htmlContent: string): boolean => {
    if (!htmlContent) return true;

    // Remove HTML tags and decode HTML entities
    const textContent = htmlContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&[a-zA-Z0-9#]+;/g, ' ') // Replace HTML entities
      .trim();

    return textContent.length === 0;
  };

  const handleLanguageChange = (lang: 'en' | 'sw' | 'fr' | 'rn', newValue: string) => {
    onChange({
      ...value,
      [lang]: newValue
    });
  };

  const renderRichEditor = (lang: 'en' | 'sw' | 'fr' | 'rn', langLabel: string) => {
    const langValue = value[lang] || '';
    const isActive = activeLanguage === lang;
    const hasContent = !isRichTextEmpty(langValue);
    return (
      <div key={lang} className={`space-y-2 ${!isActive ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{LANGUAGES.find(l => l.code === lang)?.flag}</span>
            <span className="text-sm font-medium text-gray-700">{langLabel}</span>
            {required && <span className="text-red-500">*</span>}
          </div>
          <div className="flex items-center gap-2">
            {hasContent && (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`text-xs ${
                  isPreviewMode 
                    ? 'bg-theme-primary text-theme-secondary' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isPreviewMode ? <Edit3 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {isPreviewMode ? 'Edit' : 'Preview'}
              </Button>
            )}
          </div>
        </div>

        {isPreviewMode ? (
          <div 
            className="min-h-[100px] p-3 border border-gray-300 rounded-md bg-gray-50 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: langValue }}
            style={{
              '--tw-prose-headings': '#1f2937',
              '--tw-prose-bold': '#1f2937'
            } as React.CSSProperties}
          />
        ) : (
          <CKEditorComponent
            value={langValue}
            onChange={(newValue) => handleLanguageChange(lang, newValue)}
            placeholder={`${placeholder} (${langLabel})`}
            className="min-h-[100px]"
          />
        )}

        {/* Language Status Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${hasContent ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <span className={hasContent ? 'text-green-600' : 'text-gray-500'}>
            {hasContent ? 'Content added' : 'No content'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {/* Language Tabs */}
      <div className="flex border-b border-gray-200">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setActiveLanguage(lang.code)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeLanguage === lang.code
                ? 'border-theme-primary text-theme-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.name}
            {!isRichTextEmpty(value[lang.code] || '') && <span className="ml-1 text-green-500">✓</span>}
          </button>
        ))}
      </div>

      {/* Rich Text Editors */}
      <div className="space-y-4">
        {renderRichEditor('en', 'English')}
        {renderRichEditor('sw', 'Swahili')}
        {renderRichEditor('fr', 'French')}
        {renderRichEditor('rn', 'Kinyarwanda')}
      </div>

      <style jsx>{`
        .prose strong, .prose b {
          background-color: #fef3c7;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: bold;
        }
        
        .prose h1 {
          font-size: 1.875rem;
          font-weight: bold;
          margin: 0.5rem 0;
          color: #1f2937;
        }
        
        .prose h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0.5rem 0;
          color: #374151;
        }
      `}</style>
    </div>
  );
}
