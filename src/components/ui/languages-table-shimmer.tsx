'use client';

import React from 'react';

const LanguagesTableShimmer = () => {
  return (
    <div className="bg-white border border-[#EAECF0] rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-[#EAECF0]">
        <div className="flex items-center py-4 px-6">
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse ml-16"></div>
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse ml-16"></div>
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse ml-16"></div>
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse ml-16"></div>
          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse ml-auto"></div>
        </div>
      </div>

      {/* Table Body - Multiple skeleton rows */}
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={`border-b border-[#EAECF0] hover:bg-gray-50 transition-colors ${
            index % 2 === 0 ? 'bg-[#F9FAFB]' : 'bg-white'
          }`}
        >
          <div className="py-4 px-6">
            <div className="flex items-center justify-between">
              {/* Language column with avatar */}
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Code column */}
              <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse"></div>

              {/* Symbol column */}
              <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>

              {/* Status column */}
              <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>

              {/* Default column */}
              <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse"></div>

              {/* Actions column */}
              <div className="flex gap-2">
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LanguagesTableShimmer;
