"use client";

import { useState, useEffect } from "react";
import MarkdownEditor from "./markdown";

interface FullscreenEditorProps {
  value: string;
  onChange: (value: string) => void;
  slug: string;
  onClose: () => void;
}

export default function FullscreenEditor({
  value,
  onChange,
  slug,
  onClose,
}: FullscreenEditorProps) {
  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleEsc);
    
    // Prevent scrolling on the body when in fullscreen
    document.body.style.overflow = "hidden";
    
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Editor container - removed the header */}
      <div className="fixed-fullscreen-toolbar fullscreen-editor-container h-full w-full p-0">
        <MarkdownEditor 
          value={value} 
          onChange={onChange} 
          slug={slug} 
          isFullscreen={true}
          onFullscreenToggle={onClose}
        />
      </div>
    </div>
  );
} 