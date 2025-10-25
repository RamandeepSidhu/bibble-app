"use client";
import { useState } from "react";
import { ProductFormData, PRODUCT_TYPES, MultilingualText } from "@/lib/types/bibble";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from 'lucide-react';
import Link from "next/link";
import CKEditorComponent from "@/components/CKEditorComponent";

const steps = [
  { id: "book", title: "Book" },
  { id: 'content', title: 'Chapter' },
  { id: 'media', title: 'Story' },
  { id: 'review', title: 'Verse' }
];
const isRichTextEmpty = (htmlContent: string): boolean => {
  if (!htmlContent) return true;

  const cleaned = htmlContent
    .replace(/<(p|div|br|span)[^>]*>/gi, "") // remove empty tags
    .replace(/<\/(p|div|span)>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .replace(/\s+/g, "")
    .trim();

  return cleaned.length === 0;
};

const isMultilingualFieldComplete = (field: MultilingualText): boolean => {
  return Object.values(field).some(val => !isRichTextEmpty(val));
};

export default function AddBookPageDummyOld() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [bookData, setBookData] = useState<ProductFormData>({
    type: "book",
    title: { en: "", sw: "", fr: "", rn: "" },
    description: { en: "", sw: "", fr: "", rn: "" },
    contentType: "free",
    freePages: 0,
  });

  const handleNextStep = () => {
    setValidationError("");

    if (
      !bookData.type ||
      !isMultilingualFieldComplete(bookData.title) ||
      !isMultilingualFieldComplete(bookData.description) ||
      !bookData.contentType ||
      (bookData.contentType === 'free' && bookData.freePages <= 0)
    ) {
      setValidationError(
        "Please fill in all required fields: Product Type, Content Type, Title & Description in all languages, and Free Pages if content type is free."
      );
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleSave();
    }
  };

  const handleSave = () => {
    setValidationError("");

    if (
      !bookData.type ||
      !isMultilingualFieldComplete(bookData.title) ||
      !isMultilingualFieldComplete(bookData.description) ||
      !bookData.contentType ||
      (bookData.contentType === 'free' && bookData.freePages <= 0)
    ) {
      setValidationError(
        "Please fill in all required fields: Product Type, Content Type, Title & Description in all languages, and Free Pages if content type is free."
      );
      return;
    }

    const payload = {
      type: bookData.type,
      title: bookData.title,
      description: bookData.description,
      contentType: bookData.contentType,
      freePages: bookData.freePages,
    };

    console.log("💾 SAVE PAYLOAD", payload);

    setSuccessMessage("Product saved successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };


  const handlePrevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };


  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-6 flex items-center gap-4">
          <Link href="/products" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Add Product</h1>
            <p className="text-gray-500">Create a new product with multilingual content</p>
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
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Product Details</h2>
                <p className="text-gray-600 mb-8">Add basic information for your product.</p>

                {/* Book Type Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Product Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={bookData.type}
                    onValueChange={(value) => {
                      setBookData({ ...bookData, type: value as any });
                      setValidationError(""); // Clear validation error
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            {type.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Content Type Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Content Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={bookData.contentType}
                    onValueChange={(value) => {
                      setBookData({ ...bookData, contentType: value as 'free' | 'paid' });
                      setValidationError(""); // Clear validation error
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">🆓 Free</SelectItem>
                      <SelectItem value="paid">💰 Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional Free Pages Input */}
                {bookData.contentType === 'free' && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Free Pages <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={bookData.freePages}
                      onChange={(e) => {
                        setBookData({ ...bookData, freePages: parseInt(e.target.value) || 0 });
                        setValidationError(""); // Clear validation error
                      }}
                      placeholder="Enter number of free pages"
                      className="w-full h-[40px] px-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-colors"
                      min="0"
                    />
                  </div>
                )}

                {/* Title and Description */}
                <div className="space-y-8">
                  {/* <MultilingualRichEditor
                    label="Book Title"
                    value={bookData.title}
                    onChange={(val) => {
                      setBookData({ ...bookData, title: val });
                      setValidationError(""); // Clear validation error
                    }}
                    placeholder="Enter book title"
                    required
                  /> */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Book Title <span className="text-red-500">*</span>
                    </label>
                    <CKEditorComponent
                      value={bookData.title}
                      onChange={(val) => {
                        setBookData({ ...bookData, title: val });
                        setValidationError(""); // Clear validation error
                      }}
                      placeholder="Enter product title"
                    />
                  </div>


                  {/* <MultilingualRichEditor
                    label="Book Description"
                    value={bookData.description}
                    onChange={(val) => {
                      setBookData({ ...bookData, description: val });
                      setValidationError(""); // Clear validation error
                    }}
                    placeholder="Enter book description"
                    required
                  /> */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Book Description<span className="text-red-500">*</span>
                    </label>
                    <CKEditorComponent
                      value={bookData.description}
                      onChange={(val) => {
                        setBookData({ ...bookData, description: val });
                        setValidationError(""); // Clear validation error
                      }}
                      placeholder="Enter product description"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Other steps remain same (Story / Chapter / Verse) */}
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div className="mx-10 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-600 text-sm font-medium">
                  ⚠️ {validationError}
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mx-10 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-green-600 text-sm font-medium">
                  ✅ {successMessage}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center py-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Previous
            </Button>

            {(() => {
              // Check if first step (form) is complete
              const isFirstStepComplete = bookData.type &&
                isMultilingualFieldComplete(bookData.title) &&
                isMultilingualFieldComplete(bookData.description) &&
                bookData.contentType &&
                (bookData.contentType === 'paid' || (bookData.contentType === 'free' && bookData.freePages > 0));

              if (isFirstStepComplete) {
                return (
                  <Button
                    onClick={handleSave}
                    className="py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Save Product
                  </Button>
                );
              } else {
                return (
                  <Button
                    onClick={handleNextStep}
                    disabled={!isFirstStepComplete}
                    className={`py-3 font-semibold rounded-lg shadow-md transition-colors ${isFirstStepComplete
                      ? "bg-theme-primary hover:bg-theme-primary text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                  >
                    Next
                  </Button>
                );
              }
            })()}
          </div>
        </div>
      </div>
    </div>

  );
}