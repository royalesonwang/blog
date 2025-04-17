"use client";

import { useEffect, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FullScreenPreviewProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function FullScreenPreview({ src, alt, onClose }: FullScreenPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // 处理ESC键关闭预览
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // 防止滚动
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部控制栏 */}
        <div className="absolute -top-14 left-0 right-0 flex justify-between items-center">
          <div className="flex gap-2">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleZoomIn}
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleZoomOut}
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleRotate}
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <RotateCw className="h-5 w-5" />
            </Button>
          </div>
          
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={onClose}
            className="text-white hover:bg-white/20 hover:text-white"
            aria-label="关闭预览"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        {/* 加载动画 */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* 图片容器 */}
        <div className="overflow-hidden rounded-lg flex items-center justify-center">
          <img
            src={src}
            alt={alt || "图片预览"}
            className="max-h-[85vh] max-w-[90vw] object-contain transition-all duration-200 ease-in-out"
            style={{ 
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
            onLoad={() => setLoading(false)}
          />
        </div>
      </div>
    </div>
  );
} 