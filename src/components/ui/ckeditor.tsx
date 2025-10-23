'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, List, ListOrdered, Quote, Heading1, Heading2, Heading3 } from 'lucide-react';

interface CKEditorComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function CKEditorComponent({ value, onChange, placeholder, className = '', rows = 4 }: CKEditorComponentProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;

    try {
      editorRef.current.focus();

      // Handle special cases that don't work well with execCommand
      if (command.startsWith('formatBlock')) {
        const tagName = value?.replace(/[<>]/g, '') || 'p';
        formatBlock(tagName);
        return;
      }

      if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
        toggleList(command);
        return;
      }

      // Use execCommand for simple formatting
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      document.execCommand(command, false, value);
      handleInput();
    } catch (error) {
      console.warn('execCommand failed:', command, error);
      // Fallback to basic implementation
      handleInput();
    }
  };

  const formatBlock = (tagName: string) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText) {
      const element = document.createElement(tagName);
      element.textContent = selectedText;
      range.deleteContents();
      range.insertNode(element);
    } else {
      // If no text selected, create a new element
      const element = document.createElement(tagName);
      element.textContent = tagName === 'h1' ? 'Heading 1' : tagName === 'h2' ? 'Heading 2' : tagName === 'h3' ? 'Heading 3' : 'Paragraph';
      range.insertNode(element);
    }

    handleInput();
  };

  const toggleList = (listType: string) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    try {
      document.execCommand(listType);
      handleInput();
    } catch (error) {
      // Fallback: create list manually
      const range = selection.getRangeAt(0);
      const list = document.createElement(listType === 'insertOrderedList' ? 'ol' : 'ul');
      const listItem = document.createElement('li');
      listItem.textContent = 'List item';
      list.appendChild(listItem);
      range.insertNode(list);
      handleInput();
    }
  };

  const formatText = (command: string, value?: string) => {
    execCommand(command, value);
  };

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className="h-8 w-8 p-0"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className="h-8 w-8 p-0"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          className="h-8 w-8 p-0"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>

        {/* Separator */}
        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', '<h1>')}
          className="h-8 w-8 p-0"
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', '<h2>')}
          className="h-8 w-8 p-0"
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', '<h3>')}
          className="h-8 w-8 p-0"
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        {/* Separator */}
        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        {/* Blockquote */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('formatBlock', '<blockquote>')}
          className="h-8 w-8 p-0"
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-3 focus:outline-none min-h-[100px] focus:ring-2 focus:ring-blue-500"
        style={{
          minHeight: `${rows * 25}px`,
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
      
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable] strong, [contenteditable] b {
          background-color: #fef3c7;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: bold;
        }
        
        [contenteditable] h1 {
          font-size: 1.875rem;
          font-weight: bold;
          margin: 0.5rem 0;
          color: #1f2937;
        }
        
        [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0.5rem 0;
          color: #374151;
        }
        
        [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.5rem 0;
          color: #4b5563;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        
        [contenteditable] li {
          margin: 0.25rem 0;
          display: list-item;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 1rem;
          margin: 0.5rem 0;
          font-style: italic;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
