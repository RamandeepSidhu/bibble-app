'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MultilingualText, LANGUAGES, LanguageCode } from '@/lib/types/bibble';
import { Globe, Eye, EyeOff } from 'lucide-react';

interface MultilingualInputProps {
  label: string;
  value: MultilingualText;
  onChange: (value: MultilingualText) => void;
  placeholder?: string;
  type?: 'input' | 'textarea';
  rows?: number;
  required?: boolean;
  className?: string;
}

export function MultilingualInput({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'input',
  rows = 3,
  required = false,
  className = ''
}: MultilingualInputProps) {
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>('en');
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  const handleLanguageChange = (lang: LanguageCode, text: string) => {
    onChange({
      ...value,
      [lang]: text
    });
  };

  const currentLanguage = LANGUAGES.find(lang => lang.code === activeLanguage);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAllLanguages(!showAllLanguages)}
          className="flex items-center gap-2"
        >
          <Globe className="h-4 w-4" />
          {showAllLanguages ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showAllLanguages ? 'Hide All' : 'Show All'}
        </Button>
      </div>

      {showAllLanguages ? (
        // Show all languages
        <div className="space-y-4">
          {LANGUAGES.map((language) => (
            <div key={language.code} className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                <span>{language.flag}</span>
                {language.name}
                {required && <span className="text-red-500">*</span>}
              </Label>
              {type === 'textarea' ? (
                <Textarea
                  value={value[language.code] || ''}
                  onChange={(e) => handleLanguageChange(language.code, e.target.value)}
                  placeholder={`${placeholder} (${language.name})`}
                  rows={rows}
                  className="w-full"
                />
              ) : (
                <Input
                  value={value[language.code] || ''}
                  onChange={(e) => handleLanguageChange(language.code, e.target.value)}
                  placeholder={`${placeholder} (${language.name})`}
                  className="w-full"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        // Show single language with selector
        <div className="space-y-3">
          <div className="flex gap-2">
            {LANGUAGES.map((language) => (
              <Button
                key={language.code}
                type="button"
                variant={activeLanguage === language.code ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveLanguage(language.code)}
                className="flex items-center gap-2"
              >
                <span>{language.flag}</span>
                {language.name}
              </Button>
            ))}
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-600 flex items-center gap-2">
              <span>{currentLanguage?.flag}</span>
              {currentLanguage?.name}
              {required && <span className="text-red-500">*</span>}
            </Label>
            {type === 'textarea' ? (
              <Textarea
                value={value[activeLanguage] || ''}
                onChange={(e) => handleLanguageChange(activeLanguage, e.target.value)}
                placeholder={`${placeholder} (${currentLanguage?.name})`}
                rows={rows}
                className="w-full"
              />
            ) : (
              <Input
                value={value[activeLanguage] || ''}
                onChange={(e) => handleLanguageChange(activeLanguage, e.target.value)}
                placeholder={`${placeholder} (${currentLanguage?.name})`}
                className="w-full"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface MultilingualPreviewProps {
  value: MultilingualText;
  label?: string;
  className?: string;
}

export function MultilingualPreview({ 
  value, 
  label = 'Preview', 
  className = '' 
}: MultilingualPreviewProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
        {LANGUAGES.map((language) => (
          <div key={language.code} className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <span>{language.flag}</span>
              {language.name}
            </div>
            <div className="text-sm text-gray-800">
              {value[language.code] || (
                <span className="text-gray-400 italic">Not provided</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
