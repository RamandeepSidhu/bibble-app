'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MultilingualText, LANGUAGES } from '@/lib/types/bibble';
import { Eye, Globe, Edit3 } from 'lucide-react';

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
  type = 'input',
  rows = 4,
  required = false
}: MultilingualRichEditorProps) {
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'sw' | 'fr' | 'rn'>('en');
  const [showAllLanguages, setShowAllLanguages] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeFormatting, setActiveFormatting] = useState<{[key: string]: boolean}>({});

  const handleLanguageChange = (lang: 'en' | 'sw' | 'fr' | 'rn', newValue: string) => {
    onChange({
      ...value,
      [lang]: newValue
    });
  };

  const handleFormattingClick = (format: string, lang: 'en' | 'sw' | 'fr' | 'rn') => {
    const editorId = `${lang}-editor`;
    const textarea = document.getElementById(editorId) as HTMLTextAreaElement;
    
    console.log('Formatting click:', format, lang, textarea);
    
    if (textarea) {
      // Focus the textarea
      textarea.focus();
      
      // Get current text and selection
      const currentText = textarea.value;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = currentText.substring(start, end);
      
      console.log('Selected text:', selectedText, 'Start:', start, 'End:', end);
      
      if (selectedText) {
        // Apply formatting to selected text
        let formattedText = '';
        switch (format) {
          case 'bold':
            formattedText = `<strong>${selectedText}</strong>`;
            break;
          case 'italic':
            formattedText = `<em>${selectedText}</em>`;
            break;
          case 'underline':
            formattedText = `<u>${selectedText}</u>`;
            break;
          case 'h1':
            formattedText = `<h1>${selectedText}</h1>`;
            break;
          case 'h2':
            formattedText = `<h2>${selectedText}</h2>`;
            break;
          case 'p':
            formattedText = `<p>${selectedText}</p>`;
            break;
          case 'list':
            formattedText = `<ul><li>${selectedText}</li></ul>`;
            break;
        }
        
        // Replace selected text with formatted text
        const newText = currentText.substring(0, start) + formattedText + currentText.substring(end);
        console.log('New formatted text:', newText);
        
        // Update the content
        handleLanguageChange(lang, newText);
        
        // Update textarea value to show plain text
        textarea.value = newText.replace(/<[^>]*>/g, '');
      } else {
        console.log('No text selected');
      }
    }
  };

  const isFormattingActive = (format: string, lang: 'en' | 'sw' | 'fr' | 'rn') => {
    const key = `${lang}-${format}`;
    return activeFormatting[key] || false;
  };

  const updateFormattingStates = useCallback((lang: 'en' | 'sw' | 'fr' | 'rn') => {
    // For textarea, we'll keep formatting states simple
    // They'll be managed by the formatting buttons themselves
    const newStates: {[key: string]: boolean} = {};
    
    // Reset all states for this language
    newStates[`${lang}-bold`] = false;
    newStates[`${lang}-italic`] = false;
    newStates[`${lang}-underline`] = false;
    newStates[`${lang}-h1`] = false;
    newStates[`${lang}-h2`] = false;
    newStates[`${lang}-p`] = false;
    newStates[`${lang}-list`] = false;
    
    setActiveFormatting(prev => ({
      ...prev,
      ...newStates
    }));
  }, []);

  // Add event listeners for editor interactions
  useEffect(() => {
    const handleEditorEvents = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.id && target.id.endsWith('-editor')) {
        const lang = target.id.replace('-editor', '') as 'en' | 'sw' | 'fr' | 'rn';
        updateFormattingStates(lang);
      }
    };

    // Add event listeners
    document.addEventListener('mouseup', handleEditorEvents);
    document.addEventListener('keyup', handleEditorEvents);
    document.addEventListener('selectionchange', handleEditorEvents);

    return () => {
      document.removeEventListener('mouseup', handleEditorEvents);
      document.removeEventListener('keyup', handleEditorEvents);
      document.removeEventListener('selectionchange', handleEditorEvents);
    };
  }, [updateFormattingStates]);

  const toggleLanguageVisibility = (lang: 'en' | 'sw' | 'fr' | 'rn') => {
    if (value[lang]) {
      setActiveLanguage(lang);
    }
  };

  const renderRichEditor = (lang: 'en' | 'sw' | 'fr' | 'rn', langLabel: string) => {
    const langValue = value[lang] || '';
    const isActive = activeLanguage === lang;
    const hasContent = !!langValue;

    return (
      <div key={lang} className={`space-y-2 ${!isActive && !showAllLanguages ? 'hidden' : ''}`}>
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
            {!showAllLanguages && (
              <Button
                type="button"
                size="sm"
                onClick={() => toggleLanguageVisibility(lang)}
                className="text-xs"
              >
                <Globe className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {isPreviewMode ? (
          <div 
            className="min-h-[100px] p-3 border border-gray-300 rounded-md bg-gray-50 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: langValue }}
          />
        ) : (
          <div className="space-y-2">
            {/* Rich Text Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 border border-gray-300 rounded-t-md bg-gray-50">
              <Button
                type="button"
                size="sm"
                className={`text-xs h-6 px-2 ${
                  isFormattingActive('bold', lang) 
                    ? 'bg-theme-primary text-theme-secondary' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => handleFormattingClick('bold', lang)}
              >
                <strong>B</strong>
              </Button>
              <Button
                type="button"
                size="sm"
                className={`text-xs h-6 px-2 ${
                  isFormattingActive('italic', lang) 
                    ? 'bg-theme-primary text-theme-secondary' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => handleFormattingClick('italic', lang)}
              >
                <em>I</em>
              </Button>
              <Button
                type="button"
                size="sm"
                className={`text-xs h-6 px-2 ${
                  isFormattingActive('underline', lang) 
                    ? 'bg-theme-primary text-theme-secondary' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => handleFormattingClick('underline', lang)}
              >
                <u>U</u>
              </Button>
              <div className="w-px h-4 bg-gray-300 mx-1"></div>
              <Button
                type="button"
                size="sm"
                className={`text-xs h-6 px-2 ${
                  isFormattingActive('h1', lang) 
                    ? 'bg-theme-primary text-theme-secondary' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => handleFormattingClick('h1', lang)}
              >
                H1
              </Button>
              <Button
                type="button"
                size="sm"
                className={`text-xs h-6 px-2 ${
                  isFormattingActive('h2', lang) 
                    ? 'bg-theme-primary text-theme-secondary' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => handleFormattingClick('h2', lang)}
              >
                H2
              </Button>
              <Button
                type="button"
                size="sm"
                className={`text-xs h-6 px-2 ${
                  isFormattingActive('p', lang) 
                    ? 'bg-theme-primary text-theme-secondary' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => handleFormattingClick('p', lang)}
              >
                P
              </Button>
              <div className="w-px h-4 bg-gray-300 mx-1"></div>
              <Button
                type="button"
                size="sm"
                className={`text-xs h-6 px-2 ${
                  isFormattingActive('list', lang) 
                    ? 'bg-theme-primary text-theme-secondary' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => handleFormattingClick('list', lang)}
              >
                • List
              </Button>
            </div>

            {/* Text Editor - Simple textarea with manual formatting */}
            <div className="relative">
              <Textarea
                id={`${lang}-editor`}
                value={langValue.replace(/<[^>]*>/g, '')} // Strip HTML for display
                onChange={(e) => {
                  const plainText = e.target.value;
                  console.log('Textarea input:', plainText);
                  handleLanguageChange(lang, plainText);
                }}
                placeholder={`${placeholder} (${langLabel})`}
                rows={rows}
                className="min-h-[100px] p-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ 
                  minHeight: `${rows * 1.5}rem`,
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
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
            {value[lang.code] && <span className="ml-1 text-green-500">✓</span>}
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

      {/* Content Preview */}
      {showAllLanguages && (
        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Content Preview</h4>
          <div className="space-y-3">
            {LANGUAGES.map((lang) => {
              const content = value[lang.code];
              return content ? (
                <div key={lang.code} className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                  <div 
                    className="text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
