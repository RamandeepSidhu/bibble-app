"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { MultilingualRichEditor } from "@/components/ui/multilingual-rich-editor";
import { ArrowLeft, Save } from 'lucide-react';
import Link from "next/link";
import { ProductFormData } from "@/lib/types/bibble";

const steps = [
  { id: "book", title: "Book" },
  { id: 'content', title: 'Chapter' },
  { id: 'media', title: 'Story' },
  { id: 'review', title: 'Verse' }
];

export default function AddBookPage() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [bookData, setBookData] = useState<ProductFormData>({
    type: "book",
    title: { en: "", sw: "", fr: "", rn: "" },
    description: { en: "", sw: "", fr: "", rn: "" },
  });

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleSave = () => {
    const payload = {
      type: bookData.type,
      title: bookData.title, // HTML from CKEditor
      description: bookData.description, // HTML from CKEditor
    };

    console.log("📘 Final Book Payload:", JSON.stringify(payload, null, 2));
    alert("Book saved successfully!");
  };

  return (
<div className="bg-white min-h-screen">
  {/* Header */}
  <div className="border-b border-gray-100 bg-white">
    <div className="max-w-6xl mx-auto px-5 py-6 flex items-center gap-4">
      <Link href="/books" className="text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-6 w-6" />
      </Link>
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-900">Add Bible Book</h1>
        <p className="text-gray-500">Create a new book with multilingual content</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-500">Draft</span>
      </div>
    </div>
  </div>

  {/* Stepper */}
      <div className="max-w-6xl mx-auto px-5 py-5">
    <Stepper steps={steps} currentStep={currentStep} />

    <div className="mt-10 bg-white border border-gray-100 shadow-md rounded-2xl overflow-hidden">
      <div className="p-10 space-y-8">
        {/* BOOK DETAILS STEP */}
        {currentStep === 0 && (
          <>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Book Details</h2>
            <p className="text-gray-600 mb-8">Add basic information for your bible book.</p>

            {/* Title and Description */}
            <div className="space-y-8">
              <MultilingualRichEditor
                label="Book Title"
                value={bookData.title}
                onChange={(val) => setBookData({ ...bookData, title: val })}
                placeholder="Enter book title"
                required
              />

              <MultilingualRichEditor
                label="Book Description"
                value={bookData.description}
                onChange={(val) => setBookData({ ...bookData, description: val })}
                placeholder="Enter book description"
                required
              />
            </div>
          </>
        )}

        {/* Other steps remain same (Story / Chapter / Verse) */}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center px-10 py-6 border-t border-gray-200 bg-gray-50">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStep === 0}
          className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Previous
        </Button>

        {currentStep === steps.length - 1 ? (
          <Button
            onClick={handleSave}
            className="px-8 py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors"
          >
            <Save className="h-5 w-5 mr-2" />
            Save Book
          </Button>
        ) : (
          <Button
            onClick={handleNextStep}
            className="px-8 py-3 bg-theme-primary hover:bg-theme-prima text-white font-semibold rounded-lg shadow-md transition-colors"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  </div>
</div>

  );
}
