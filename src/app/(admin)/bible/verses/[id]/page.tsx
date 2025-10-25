'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Hash, BookOpen, Globe } from 'lucide-react';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import { MultilingualText, Chapter, Language } from '@/lib/types/bibble';

interface Verse {
  _id: string;
  chapterId: string | { _id: string; title: MultilingualText };
  number: number;
  text: MultilingualText;
  createdAt?: string;
  updatedAt?: string;
}

export default function ViewVersePage() {
  const params = useParams();
  const router = useRouter();
  const verseId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [verse, setVerse] = useState<Verse | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [story, setStory] = useState<any>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageNames, setLanguageNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (verseId) {
      loadVerseData();
      fetchLanguages();
    }
  }, [verseId]);

  const fetchLanguages = async () => {
    try {
      const [languageResponse, languageCodeResponse] = await Promise.all([
        ClientInstance.APP.getLanguage(),
        ClientInstance.APP.getLanguageCode()
      ]);

      if ((languageResponse as any)?.success && (languageResponse as any)?.data) {
        let languagesData = (languageResponse as any).data;

        if ((languageCodeResponse as any)?.success && (languageCodeResponse as any)?.data) {
          const languageCodes = (languageCodeResponse as any).data;
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

        // Filter out Hindi language from available languages
        const filteredLangs = languagesData.filter((lang: any) => lang.code !== 'hi');
        setLanguages(filteredLangs);

        const namesMapping: { [key: string]: string } = {};
        filteredLangs.forEach((lang: any) => {
          if (lang.code && lang.name) namesMapping[lang.code] = lang.name;
        });
        setLanguageNames(namesMapping);
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
    }
  };

  const loadVerseData = async () => {
    try {
      setIsLoading(true);
      const verseResponse: any = await ClientInstance.APP.getVerseById(verseId);
      if (verseResponse?.success && verseResponse?.data) {
        const verseData = verseResponse.data;
        setVerse(verseData);

        // Load chapter and story information
        await loadChapterAndStory(verseData);
      } else {
        showToast.error("Error", "Failed to load verse data");
        router.push('/bible');
      }
    } catch (error) {
      console.error("Error loading verse:", error);
      showToast.error("Error", "Failed to load verse data");
      router.push('/bible');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChapterAndStory = async (verseData: Verse) => {
    try {
      const chapterId = typeof verseData.chapterId === 'object' ? verseData.chapterId._id : verseData.chapterId;

      // Load chapter
      const chapterResponse: any = await ClientInstance.APP.getChapterById(chapterId);
      if (chapterResponse?.success && chapterResponse?.data) {
        const chapterData = chapterResponse.data;
        setChapter(chapterData);

        // Load story information
        const storyId = typeof chapterData.storyId === 'object' ? chapterData.storyId._id : chapterData.storyId;
        if (storyId) {
          const storyResponse: any = await ClientInstance.APP.getStoryById(storyId);
          if (storyResponse?.success && storyResponse?.data) {
            setStory(storyResponse.data);
          }
        }
      }
    } catch (error) {
      console.error("Error loading chapter/story:", error);
    }
  };

  const getLanguageName = (code: string) => {
    return languageNames[code] || code.toUpperCase();
  };

  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  const handleEdit = () => {
    router.push(`/bible/verses/edit/${verseId}`);
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading verse...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!verse) {
    return (
      <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verse Not Found</h2>
            <p className="text-gray-600 mb-4">The requested verse could not be found.</p>
            <Button onClick={handleBack} className="bg-theme-primary hover:bg-theme-primary text-white">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto px-5 py-6 flex items-center gap-4">
          <Button variant="outline" onClick={handleBack} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">View Verse</h1>
            <p className="text-gray-500">Read verse content</p>
          </div>
          <Button onClick={handleEdit} className="bg-theme-primary hover:bg-theme-primary text-white">
            <Edit className="h-4 w-4 mr-2" />
            Edit Verse
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto px-5 py-6">
        <div className="bg-white border border-gray-100 shadow-md rounded-2xl overflow-hidden">

          {/* Verse Header */}
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <Hash className="h-8 w-8 text-theme-primary" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Verse {verse.number}</h2>
                <p className="text-gray-600">ID: {verse._id}</p>
              </div>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          {(story || chapter) && (
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Navigation:</span>
                {story && (
                  <>
                    <span className="font-medium text-gray-900">
                      {stripHtmlTags(String(Object.values(story.title || {})[0] || 'Story'))}
                    </span>
                    <span>→</span>
                  </>
                )}
                {chapter && (
                  <>
                    <span className="font-medium text-gray-900">
                      {stripHtmlTags(String(Object.values(chapter.title || {})[0] || 'Chapter'))}
                    </span>
                    <span>→</span>
                  </>
                )}
                <span className="font-medium text-theme-primary">Verse {verse.number}</span>
              </div>
            </div>
          )}

          {/* Verse Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Language Versions */}
              {Object.entries(verse.text || {}).map(([langCode, text]) => (
                <div key={langCode} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-5 w-5 text-theme-primary" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getLanguageName(langCode)}
                    </h3>
                    <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded border">
                      {langCode.toUpperCase()}
                    </span>
                  </div>

                  {/* Verse Text */}
                  <div className="prose prose-lg max-w-none">
                    <div
                      className="text-gray-800 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: text }}
                    />
                  </div>

                  {/* Plain text version for reference */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 italic">
                      Plain text: {stripHtmlTags(text)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Metadata */}
              <div className="border-t border-gray-200 pt-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Verse ID:</span> {verse._id}
                  </div>
                  <div>
                    <span className="font-medium">Verse Number:</span> {verse.number}
                  </div>
                  {verse.createdAt && (
                    <div>
                      <span className="font-medium">Created:</span> {new Date(verse.createdAt).toLocaleDateString()}
                    </div>
                  )}
                  {verse.updatedAt && (
                    <div>
                      <span className="font-medium">Updated:</span> {new Date(verse.updatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <Button variant="outline" onClick={handleBack} className="py-3 border-gray-300 text-gray-700 hover:bg-gray-100">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    📋 Copy Link
                  </Button>
                  <Button onClick={handleEdit} className="bg-theme-primary hover:bg-theme-primary text-white">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Verse
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
