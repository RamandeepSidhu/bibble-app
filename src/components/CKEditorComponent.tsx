// components/CKEditorComponent.tsx
'use client';

import { FC, useState, useEffect } from 'react';
import { MultilingualText, Language } from '@/lib/types/bibble';
import { Button } from '@/components/ui/button';
import { Eye, Edit3 } from 'lucide-react';
import ClientInstance from '@/shared/client';

interface CKEditorComponentProps {
    value: MultilingualText;
    onChange: (value: MultilingualText) => void;
    placeholder?: string;
    className?: string;
}

const CKEditorComponent: FC<CKEditorComponentProps> = ({ value, onChange, placeholder, className }) => {
    const [EditorComponent, setEditorComponent] = useState<any>(null);
    const [isClient, setIsClient] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState<string>('en');
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);

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

    // Fetch languages and language codes from API
    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                setIsLoadingLanguages(true);
                
                // Fetch both language names and language codes
                const [languageResponse, languageCodeResponse] = await Promise.all([
                    ClientInstance.APP.getLanguage(),
                    ClientInstance.APP.getLanguageCode()
                ]);

                if ((languageResponse as any)?.success && (languageResponse as any)?.data) {
                    let languagesData = (languageResponse as any).data;
                    
                    // If we also have language codes, merge them with language data
                    if ((languageCodeResponse as any)?.success && (languageCodeResponse as any)?.data) {
                        const languageCodes = (languageCodeResponse as any).data;
                        
                        // Merge language codes with language data
                        languagesData = languagesData.map((lang: any) => {
                            const matchingCode = languageCodes.find((code: any) => 
                                code.code === lang.code || code.name === lang.name
                            );
                            return {
                                ...lang,
                                code: matchingCode?.code || lang.code,
                                name: lang.name,
                                flag: lang.flag || '🌐'
                            };
                        });
                    }
                    
                    setLanguages(languagesData);
                    // Set first language as active if available
                    if (languagesData.length > 0) {
                        setActiveLanguage(languagesData[0].code);
                    }
                }
            } catch (error) {
                console.error("Error fetching languages:", error);
                // No fallback - rely only on API data
                setLanguages([]);
            } finally {
                setIsLoadingLanguages(false);
            }
        };

        fetchLanguages();
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

    const handleLanguageChange = (lang: string, newValue: string) => {
        onChange({
            ...value,
            [lang]: newValue
        });
    };

    // Show loading state while fetching languages or loading editor
    if (isLoadingLanguages || !isClient || !EditorComponent) {
        return (
            <div className={`space-y-4 ${className || ''}`}>
                <div className="min-h-[200px] border border-gray-300 rounded-lg p-3 flex items-center justify-center text-gray-500">
                    {isLoadingLanguages ? 'Loading languages...' : 'Loading editor...'}
                </div>
            </div>
        );
    }

    const { CKEditor, ClassicEditor } = EditorComponent;

    const renderLanguageEditor = (lang: Language) => {
        const langValue = value[lang.code] || '';
        const isActive = activeLanguage === lang.code;
        const hasContent = !isRichTextEmpty(langValue);

        return (
            <div key={lang.code} className={`space-y-2 ${!isActive ? 'hidden' : ''}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">{lang.name}</span>
                        <span className="text-xs text-gray-500">({lang.code})</span>
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
                                placeholder: `${placeholder || ''} (${lang.name})`,
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
                                handleLanguageChange(lang.code, data);
                            }}
                        />
                    </div>
                )}

                {/* Language Status Indicator */}
                <div className="flex items-center gap-2 text-xs mb-3">
                    <div className={`w-2 h-2 rounded-full ${hasContent ? 'bg-green-500 mb-3' : 'bg-gray-300 mb-3'}`}></div>
                    <span className={hasContent ? 'text-green-600 mb-3' : 'text-gray-500  mb-3'}>
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
                {languages.map((lang) => (
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
                        {lang.name} ({lang.code})
                        {!isRichTextEmpty(value[lang.code] || '') && <span className="ml-1 text-green-500">✓</span>}
                    </button>
                ))}
            </div>

            {/* Rich Text Editors */}
            <div className="space-y-4">
                {languages.map((lang) => renderLanguageEditor(lang))}
            </div>
        </div>
    );
};

export default CKEditorComponent;
