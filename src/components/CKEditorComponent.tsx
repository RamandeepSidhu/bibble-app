// components/CKEditorComponent.tsx
'use client';

import { FC, useState, useEffect } from 'react';
import { MultilingualText, LANGUAGES } from '@/lib/types/bibble';
import { Button } from '@/components/ui/button';
import { Eye, Edit3 } from 'lucide-react';

interface CKEditorComponentProps {
    value: MultilingualText;
    onChange: (value: MultilingualText) => void;
    placeholder?: string;
    className?: string;
}

const CKEditorComponent: FC<CKEditorComponentProps> = ({ value, onChange, placeholder, className }) => {
    const [EditorComponent, setEditorComponent] = useState<any>(null);
    const [isClient, setIsClient] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState<'en' | 'sw' | 'fr' | 'rn'>('en');
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Load both CKEditor components
        Promise.all([
            import('@ckeditor/ckeditor5-react'),
            import('@ckeditor/ckeditor5-build-classic')
        ]).then(([CKEditorModule, ClassicEditorModule]) => {
            setEditorComponent({
                CKEditor: CKEditorModule.CKEditor,
                ClassicEditor: ClassicEditorModule.default
            });
        }).catch((error) => {
            console.error('Failed to load CKEditor:', error);
        });
    }, []);

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

    // Don't render CKEditor until client-side and components are loaded
    if (!isClient || !EditorComponent) {
        return (
            <div className={`space-y-4 ${className || ''}`}>
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
                                    : 'border-transparent text-theme-primary/60 hover:text-theme-primary hover:border-theme-primary/30'
                            }`}
                        >
                            <span className="mr-1">{lang.flag}</span>
                            {lang.name}
                            {!isRichTextEmpty(value[lang.code] || '') && <span className="ml-1 text-green-500">✓</span>}
                        </button>
                    ))}
                </div>
                <div className="min-h-[200px] border border-gray-300 rounded-lg p-3 flex items-center justify-center text-gray-500">
                    Loading editor...
                </div>
            </div>
        );
    }

    const { CKEditor, ClassicEditor } = EditorComponent;

    const renderLanguageEditor = (lang: 'en' | 'sw' | 'fr' | 'rn', langLabel: string) => {
        const langValue = value[lang] || '';
        const isActive = activeLanguage === lang;
        const hasContent = !isRichTextEmpty(langValue);

        return (
            <div key={lang} className={`space-y-2 ${!isActive ? 'hidden' : ''}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{LANGUAGES.find(l => l.code === lang)?.flag}</span>
                        <span className="text-sm font-medium text-gray-700">{langLabel}</span>
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
                                        : 'bg-theme-secondary text-theme-primary hover:bg-theme-secondary-dark'
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
                        className="min-h-[100px] p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                        dangerouslySetInnerHTML={{ __html: langValue }}
                    />
                ) : (
                    <div className="w-full border rounded-lg">
                        <CKEditor
                            editor={ClassicEditor}
                            data={langValue}
                            config={{
                                placeholder: `${placeholder || ''} (${langLabel})`,
                                toolbar: {
                                    items: [
                                        "undo",
                                        "redo",
                                        "|",
                                        "heading",
                                        "|",
                                        "fontfamily",
                                        "fontsize",
                                        "fontColor",
                                        "fontBackgroundColor",
                                        "|",
                                        "bold",
                                        "italic",
                                        "strikethrough",
                                        "subscript",
                                        "superscript",
                                        "code",
                                        "|",
                                        "link",
                                        "blockQuote",
                                        "codeBlock",
                                        "|",
                                        "bulletedList",
                                        "numberedList",
                                        "todoList",
                                        "outdent",
                                        "indent",
                                    ],
                                    shouldNotGroupWhenFull: false,
                                },
                            }}
                            onChange={(event: any, editor: any) => {
                                const data = editor.getData();
                                handleLanguageChange(lang, data);
                            }}
                        />
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
        <div className={`space-y-4 ${className || ''}`}>
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
                                : 'border-transparent text-theme-primary/60 hover:text-theme-primary hover:border-theme-primary/30'
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
                {renderLanguageEditor('en', 'English')}
                {renderLanguageEditor('sw', 'Swahili')}
                {renderLanguageEditor('fr', 'French')}
                {renderLanguageEditor('rn', 'Kinyarwanda')}
            </div>
        </div>
    );
};

export default CKEditorComponent;
