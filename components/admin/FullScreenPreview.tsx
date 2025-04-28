"use client";

import { useEffect, useState, useRef } from "react";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

interface FullScreenPreviewProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function FullScreenPreview({ src, alt, onClose }: FullScreenPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // 处理ESC键关闭预览
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // 防止滚动
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // 获取图片原始尺寸
  const handleImageLoad = () => {
    setLoading(false);
    if (imgRef.current) {
      setNaturalSize({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight
      });
    }
  };

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

  // 处理关闭并添加动画
  const handleClose = () => {
    setIsVisible(false);
    // 等待动画完成后再真正关闭
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // 计算合适的样式
  const getImageStyle = () => {
    const isLandscape = naturalSize.width > naturalSize.height;
    const isRotated = rotation % 180 !== 0;
    
    // 基本样式
    const style: React.CSSProperties = {
      maxHeight: isRotated ? '90vw' : '90vh',
      maxWidth: isRotated ? '90vh' : '90vw',
      transform: `scale(${zoom}) rotate(${rotation}deg)`,
      transformOrigin: 'center center',
      transition: 'all 200ms ease-in-out',
    };

    return style;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div 
            className="relative flex items-center justify-center w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部控制栏 */}
            <motion.div 
              className="absolute top-4 left-0 right-0 flex justify-between items-center px-4 z-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
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
                onClick={handleClose}
                className="text-white hover:bg-white/20 hover:text-white"
                aria-label="关闭预览"
              >
                <X className="h-6 w-6" />
              </Button>
            </motion.div>
            
            {/* 加载动画 */}
            {loading && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              </motion.div>
            )}
            
            {/* 图片容器 */}
            <motion.div 
              className="flex items-center justify-center w-full h-full overflow-hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <img
                ref={imgRef}
                src={src}
                alt={alt || "图片预览"}
                className="object-contain"
                style={getImageStyle()}
                onLoad={handleImageLoad}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 