"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as React from "react";
import { 
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getImageUrl, getThumbnailUrl } from "@/lib/url";
import { formatExposureTime, formatFNumber, formatFocalLength } from "@/lib/exif-parser";

// 动画相关常量
const TRANSITION_DURATION = 500; // ms
const SLIDE_EASING = "cubic-bezier(0.25, 1, 0.5, 1)";
const FADE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const ZOOM_DURATION = 350;
const BLUR_DURATION = 300;
const PRELOAD_COUNT = 2;

// 手势相关常量
const SWIPE_THRESHOLD = 50; // 滑动阈值，超过这个距离才触发滑动动作
const AUTO_HIDE_DELAY = 1500; // 自动隐藏UI的延迟时间（毫秒）

// 创建没有关闭按钮的自定义对话框内容组件
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (  <DialogPortal>
    <DialogOverlay className="transition-opacity duration-300 bg-black/60 backdrop-blur-sm border-0 outline-none" style={{ border: 'none', outline: 'none' }} />    <DialogPrimitive.Content
      ref={ref}      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-0 bg-black backdrop-blur-md p-0 border-0 outline-none shadow-none transition-all duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-hidden",
        className
      )}
      style={{ boxShadow: 'none', outline: 'none', border: 'none' }}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));

CustomDialogContent.displayName = 'CustomDialogContent';

interface AlbumImage {
  id: number;
  file_name: string;
  original_file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  description?: string;
  alt_text?: string;
  tags?: string[];
  folder_name: string;
  group_id: number;
  created_at: string;
  updated_at: string;
  device?: string;
  location?: string;
  exif_iso?: number | null; // ISO值
  exif_exposure_time?: number | null; // 快门速度
  exif_f_number?: number | null; // 光圈值
  exif_focal_length?: number | null; // 焦距
}

interface AlbumViewerDialogProps {
  open: boolean;
  onClose: () => void;
  albumId: number;
  albumTitle: string;
}

export default function AlbumViewerDialog({
  open,
  onClose,
  albumId,
  albumTitle,
}: AlbumViewerDialogProps) {
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<AlbumImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'none' | 'right' | 'left'>('none');  
  const [imageLoaded, setImageLoaded] = useState(false);  const [thumbnailsScrollPosition, setThumbnailsScrollPosition] = useState(0);    const [showInfoBar, setShowInfoBar] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false); // 标记是否通过键盘导航切换图片
  const infoBarTimerRef = useRef<NodeJS.Timeout | null>(null);
  const thumbnailsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rightArrowRef = useRef<HTMLButtonElement>(null);
  const currentImage = images[currentImageIndex];
  
  // 触摸相关状态
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  const [touchDistance, setTouchDistance] = useState<number | null>(null);
  const [scale, setScale] = useState(1); // 图片缩放比例
  const [isPinching, setIsPinching] = useState(false); // 是否正在执行捏合手势
  const lastTouch = useRef<{x: number, y: number} | null>(null); // 记录最后一次触摸位置
  const initialPinchDistance = useRef<number | null>(null); // 记录初始捏合距离
  // 移除触摸提示组件
  useEffect(() => {
    if (open && albumId) {
      fetchAlbumImages();
      
      // 显示上下栏
      setShowInfoBar(true);
      setShowThumbnails(true);
      
      // 清除之前的定时器
      if (infoBarTimerRef.current) {
        clearTimeout(infoBarTimerRef.current);
      }
      
      if (thumbnailsTimerRef.current) {
        clearTimeout(thumbnailsTimerRef.current);  
      }
      
      // 设置自动隐藏定时器
      setupAutoHideTimers();
    }
  }, [open, albumId]);  useEffect(() => {    setImageLoaded(false);
    
    // 只有在非键盘导航时才显示信息栏和缩略图
    if (!isKeyboardNavigation) {
      setShowInfoBar(true);
      setShowThumbnails(true);
    }
    
    // 重置缩放状态
    setScale(1);
    
    // 清除之前的定时器
    if (infoBarTimerRef.current) {
      clearTimeout(infoBarTimerRef.current);
    }
    
    if (thumbnailsTimerRef.current) {
      clearTimeout(thumbnailsTimerRef.current);
    }
    
    // 只有在非键盘导航时才设置定时器
    if (!isKeyboardNavigation) {
      setupAutoHideTimers();
    }
    
    // 重置键盘导航标志
    setIsKeyboardNavigation(false);
  }, [currentImageIndex]);
  // 图片预加载
  useEffect(() => {
    if (images.length === 0 || !currentImage) return;
    
    // 预加载当前图片周围的图片
    const preloadImages = () => {
      for (let i = 1; i <= PRELOAD_COUNT; i++) {
        const nextIdx = (currentImageIndex + i) % images.length;
        const prevIdx = (currentImageIndex - i + images.length) % images.length;
          if (typeof window !== 'undefined') {
          const nextImg = document.createElement('img');
          nextImg.src = getImageUrl(images[nextIdx].file_path);
          nextImg.style.display = 'none';
          nextImg.setAttribute('aria-hidden', 'true');
          
          const prevImg = document.createElement('img');
          prevImg.src = getImageUrl(images[prevIdx].file_path);
          prevImg.style.display = 'none';
          prevImg.setAttribute('aria-hidden', 'true');
        }
      }
    };
    
    preloadImages();
  }, [images, currentImageIndex, currentImage]);

  // 同步缩略图滚动位置
  useEffect(() => {
    if (!thumbnailsContainerRef.current) return;
    
    const thumbnailWidth = 72; // 包含间距的缩略图宽度
    const containerWidth = thumbnailsContainerRef.current.clientWidth;
    const centerPosition = currentImageIndex * thumbnailWidth - containerWidth / 2 + thumbnailWidth / 2;
    
    thumbnailsContainerRef.current.scrollTo({
      left: Math.max(0, centerPosition),
      behavior: 'smooth'
    });
  }, [currentImageIndex]);

  const fetchAlbumImages = async () => {
    setLoading(true);
      try {
      const response = await fetch(`/api/albums/${albumId}/images`);
      const data = await response.json();
      
      if (response.ok) {
        setImages(data.images || []);
        setCurrentImageIndex(0); // 重置为第一张图片
        
        // 确保在加载完图片后显示信息栏和缩略图
        setShowInfoBar(true);
        setShowThumbnails(true);
        
        // 设置自动隐藏定时器
        setupAutoHideTimers();
      } else {
        setError(data.message || "获取相册图片失败");
      }
    } catch (error) {
      console.error("Error fetching album images:", error);
      setError("获取相册图片失败");
    } finally {
      setLoading(false);
    }
  };

  const nextImage = useCallback(() => {
    if (images.length === 0) return;
    setImageLoaded(false);
    setSlideDirection('right');
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    
    // 重置过渡动画状态
    setTimeout(() => {
      setSlideDirection('none');
    }, TRANSITION_DURATION);
  }, [images.length]);
  const prevImage = useCallback(() => {
    if (images.length === 0) return;
    setImageLoaded(false);
    setSlideDirection('left');
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    
    // 重置过渡动画状态
    setTimeout(() => {
      setSlideDirection('none');
    }, TRANSITION_DURATION);
  }, [images.length]);

  // 键盘导航专用函数 - 不会触发UI显示
  const nextImageKeyboard = useCallback(() => {
    if (images.length === 0) return;
    setIsKeyboardNavigation(true);
    setImageLoaded(false);
    setSlideDirection('right');
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    
    // 重置过渡动画状态
    setTimeout(() => {
      setSlideDirection('none');
    }, TRANSITION_DURATION);
  }, [images.length]);

  const prevImageKeyboard = useCallback(() => {
    if (images.length === 0) return;
    setIsKeyboardNavigation(true);
    setImageLoaded(false);
    setSlideDirection('left');
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    
    // 重置过渡动画状态
    setTimeout(() => {
      setSlideDirection('none');
    }, TRANSITION_DURATION);
  }, [images.length]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "今天";
    } else if (diffDays === 1) {
      return "昨天";
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === "ArrowRight") {
        nextImageKeyboard();
      } else if (e.key === "ArrowLeft") {
        prevImageKeyboard();
      } else if (e.key === "Escape") {
        // 如果图片处于放大状态，先重置缩放而不是关闭对话框
        if (scale > 1.1) {
          setScale(1);
          e.preventDefault(); // 阻止对话框关闭
          e.stopPropagation();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, nextImageKeyboard, prevImageKeyboard, onClose, scale]);
  // 移动端触摸支持  // 计算两个触摸点之间的距离
  const calculateDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  // 处理触摸开始事件
  const handleTouchStart = (e: React.TouchEvent) => {
    const touches = e.touches;
    
    if (touches.length === 1) {
      // 单指触摸 - 记录起始位置用于滑动检测
      setTouchEndX(null);
      setTouchEndY(null);
      setTouchStartX(touches[0].clientX);
      setTouchStartY(touches[0].clientY);
      lastTouch.current = { x: touches[0].clientX, y: touches[0].clientY };
        // 同时显示上下信息栏和导航控件
      setShowInfoBar(true);
      setShowThumbnails(true);

      // 清除任何现有的自动隐藏定时器
      if (infoBarTimerRef.current) {
        clearTimeout(infoBarTimerRef.current);
      }
      
      if (thumbnailsTimerRef.current) {
        clearTimeout(thumbnailsTimerRef.current);
      }
      
      // 设置新的自动隐藏定时器
      setupAutoHideTimers();
      
      // 如果图片已经放大，不阻止默认行为（允许滚动查看大图）
      if (scale > 1.1) {
        return;
      }
    } 
    else if (touches.length === 2) {
      // 双指触摸 - 初始化缩放手势
      setIsPinching(true);
      const distance = calculateDistance(touches[0], touches[1]);
      initialPinchDistance.current = distance;
      
      // 阻止默认行为，防止页面缩放而不是图片缩放
      e.preventDefault();
    }
  };

  // 处理触摸移动事件
  const handleTouchMove = (e: React.TouchEvent) => {
    const touches = e.touches;
    
    if (touches.length === 1 && !isPinching) {
      // 单指移动 - 用于滑动
      setTouchEndX(touches[0].clientX);
      setTouchEndY(touches[0].clientY);
      
      // 更新最后触摸位置
      lastTouch.current = { x: touches[0].clientX, y: touches[0].clientY };
      
      // 检测当前位置是在屏幕的上方还是下方
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        const touchY = touches[0].clientY - rect.top;
        const elementHeight = rect.height;        // 检测触摸是否在左右两侧的导航箭头区域
        const touchX = touches[0].clientX - rect.left;
        const isSideButtonArea = elementHeight > 0 && 
          ((touchX < 80) || (touchX > rect.width - 80)) && 
          (touchY > elementHeight * 0.4 && touchY < elementHeight * 0.6);
        
        // 左右导航区域显示缩略图，但移除上下滑动控制UI元素的功能
        if (isSideButtonArea) {
          setShowThumbnails(true);
          if (thumbnailsTimerRef.current) {
            clearTimeout(thumbnailsTimerRef.current);
          }
        }
      }
    }    else if (touches.length === 2 && initialPinchDistance.current !== null) {
      // 双指移动 - 用于缩放
      const currentDistance = calculateDistance(touches[0], touches[1]);
      const newScale = (currentDistance / initialPinchDistance.current) * scale;
      
      // 限制缩放范围，防止图片过大或过小
      if (newScale >= 0.5 && newScale <= 3) {
        setScale(newScale);
      }
      
      // 阻止默认事件以防止页面缩放
      e.preventDefault();
      e.stopPropagation();
    }
  };
  // 处理触摸结束事件
  const handleTouchEnd = (e: React.TouchEvent) => {
    // 如果是双指操作结束
    if (isPinching || e.touches.length === 0 && e.changedTouches.length === 2) {
      setIsPinching(false);
      initialPinchDistance.current = null;
      
      // 如果缩放比例接近1，则平滑动画回到1（自动回弹效果）
      if (scale < 1.1 && scale > 0.9) {
        setScale(1);
      }
      
      // 如果没有剩余触摸点，设置自动隐藏定时器
      if (e.touches.length === 0) {
        setupAutoHideTimers();
      }
      return;
    }
    
    // 处理滑动手势（只有在缩放比例接近1时才处理滑动切换）
    if (scale < 1.2 && touchStartX !== null && touchEndX !== null && touchStartY !== null && touchEndY !== null) {
      const deltaX = touchStartX - touchEndX;
      const deltaY = touchStartY - touchEndY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      // 确定是水平滑动还是垂直滑动
      if (absX > absY) {
        // 水平滑动 - 切换图片
        if (absX > SWIPE_THRESHOLD) {
          if (deltaX > 0) {
            nextImage(); // 左滑 -> 下一张
          } else {
            prevImage(); // 右滑 -> 上一张
          }
        }      } else {
        // 垂直滑动 - 不进行特殊处理
      }
    }
    
    // 重置触摸状态
    setTouchStartX(null);
    setTouchStartY(null);
    setTouchEndX(null);
    setTouchEndY(null);
    
    // 设置自动隐藏定时器
    setupAutoHideTimers();
  };
    // 设置自动隐藏UI元素的定时器 - 上下栏同时隐藏
  const setupAutoHideTimers = () => {
    // 创建单个定时器同时处理上下栏
    if (infoBarTimerRef.current) {
      clearTimeout(infoBarTimerRef.current);
    }
    
    if (thumbnailsTimerRef.current) {
      clearTimeout(thumbnailsTimerRef.current);
    }
    
    // 使用同一个定时器来同时隐藏上下栏
    const timer = setTimeout(() => {
      setShowInfoBar(false);
      setShowThumbnails(false);
    }, AUTO_HIDE_DELAY);
    
    // 保存定时器引用以便后续清除
    infoBarTimerRef.current = timer;
    thumbnailsTimerRef.current = timer;
  };// 处理图片加载完成事件
  const handleImageLoad = () => {
    setImageLoaded(true);
    
    // 如果有初始化缩放需求，可以在这里设置
    // 例如，如果是首次加载且图片过宽或过高，可以自动适应大小
    if (currentImage && currentImage.width && currentImage.height) {
      // 这里可以增加自适应缩放逻辑
    }
  };
  
  // 双击/双触事件处理，用于切换缩放状态
  const handleDoubleTap = () => {
    // 如果当前已经放大，则重置到1，否则放大到2
    setScale(scale > 1 ? 1 : 2);
  };
  
  // 处理双击
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const handleDoubleClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 300) { // 300毫秒内的两次点击视为双击
      handleDoubleTap();
      setLastClickTime(0); // 重置，避免连续多次双击
    } else {
      setLastClickTime(now);
    }
  };  // 处理鼠标移动，同时显示上下栏
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget && e.currentTarget instanceof HTMLElement) {
      // 任何鼠标移动都同时显示上下栏
      setShowInfoBar(true);
      setShowThumbnails(true);
      
      // 清除之前的隐藏定时器
      if (infoBarTimerRef.current) {
        clearTimeout(infoBarTimerRef.current);
        infoBarTimerRef.current = null;
      }
      
      if (thumbnailsTimerRef.current) {
        clearTimeout(thumbnailsTimerRef.current);
        thumbnailsTimerRef.current = null;
      }
      
      // 重新设置自动隐藏定时器
      setupAutoHideTimers();
    }
  };  // 当鼠标离开内容区域时立即隐藏控制元素
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    // 鼠标离开时直接隐藏上下栏
    if (infoBarTimerRef.current) {
      clearTimeout(infoBarTimerRef.current);
    }
    
    if (thumbnailsTimerRef.current) {
      clearTimeout(thumbnailsTimerRef.current);
    }
    
    setShowInfoBar(false);
    setShowThumbnails(false);

    // Thumbnail bar logic - 检查是否移到缩略图或右箭头上
    const relatedTarget = e.relatedTarget;
    
    // 检查relatedTarget是否为有效的DOM节点
    const isValidNode = relatedTarget instanceof Node;
    
    const isMovingToThumbnails = isValidNode && thumbnailsContainerRef.current && thumbnailsContainerRef.current.contains(relatedTarget as Node);
    const isMovingToRightArrow = isValidNode && rightArrowRef.current && rightArrowRef.current.contains(relatedTarget as Node);

    // 如果不是移到缩略图或右箭头上，则立即隐藏缩略图
    if (!isMovingToThumbnails && !isMovingToRightArrow) {
      if (thumbnailsTimerRef.current) {
        clearTimeout(thumbnailsTimerRef.current);
      }
      // 立即隐藏，不设置延迟
      setShowThumbnails(false);
    }
  };

  // 处理缩略图区域的鼠标事件
  const handleThumbnailsMouseEnter = () => {
    // 鼠标进入缩略图区域时，显示上下栏并取消自动隐藏
    setShowInfoBar(true);
    setShowThumbnails(true);
    
    // 清除任何定时器
    if (infoBarTimerRef.current) {
      clearTimeout(infoBarTimerRef.current);
      infoBarTimerRef.current = null;
    }
    
    if (thumbnailsTimerRef.current) {
      clearTimeout(thumbnailsTimerRef.current);
      thumbnailsTimerRef.current = null;
    }
  };const handleThumbnailsMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const relatedTarget = e.relatedTarget;
    
    // 检查relatedTarget是否为有效的DOM节点
    const isValidNode = relatedTarget instanceof Node;
    
    const isMovingToContentBottom = isValidNode && contentRef.current && contentRef.current.contains(relatedTarget as Node) && (e.clientY - contentRef.current.getBoundingClientRect().top > contentRef.current.getBoundingClientRect().height * 0.7);
    const isMovingToRightArrow = isValidNode && rightArrowRef.current && rightArrowRef.current.contains(relatedTarget as Node);

    if (!isMovingToContentBottom && !isMovingToRightArrow) {
      // 离开缩略图区域时重新启动自动隐藏定时器
      setupAutoHideTimers();
    }
  };

  // 清除定时器
  useEffect(() => {
    return () => {
      if (infoBarTimerRef.current) {
        clearTimeout(infoBarTimerRef.current);
      }
      if (thumbnailsTimerRef.current) {
        clearTimeout(thumbnailsTimerRef.current);
      }
    };
  }, []);
  const renderImageControls = () => {
    return (
      <>
        {/* 关闭按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-20 text-white bg-black/40 hover:bg-black/60 rounded-full transition-opacity duration-300"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        {/* 相册信息 - 顶部渐变信息栏 */}
        <div 
          className={`absolute top-0 left-0 right-0 z-10 w-full transition-opacity duration-500 ease-in-out ${
            showInfoBar ? 'opacity-100' : 'opacity-0'
          }`}
        >          <div 
            className="w-full bg-gradient-to-b from-black/70 to-transparent pt-6 pb-16 px-6"
          >            <h3 className="text-lg font-medium text-white">{albumTitle}</h3>
            {currentImage && (
              <div className="mt-1 space-y-1">
                <div className="text-sm text-white/80">
                  {formatDate(currentImage.created_at)}
                  {currentImage.device && (
                    <span> · Shot on {currentImage.device}</span>
                  )}
                  {currentImage.location && (
                    <span> · 📍 {currentImage.location}</span>
                  )}
                </div>
                {/* EXIF信息显示 */}
                {(currentImage.exif_f_number || currentImage.exif_exposure_time || currentImage.exif_iso || currentImage.exif_focal_length) && (
                  <div className="text-sm text-white/70">
                    {currentImage.exif_f_number && (
                      <span>{formatFNumber(currentImage.exif_f_number)}</span>
                    )}
                    {currentImage.exif_exposure_time && (
                      <span>{(currentImage.exif_focal_length || currentImage.exif_f_number) ? ' · ' : ''}{formatExposureTime(currentImage.exif_exposure_time)}</span>
                    )}
                    {currentImage.exif_iso && (
                      <span>{(currentImage.exif_focal_length || currentImage.exif_f_number || currentImage.exif_exposure_time) ? ' · ' : ''}ISO {currentImage.exif_iso}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* 左右导航按钮 - 只在多于一张图片时显示，位置固定在中央 */}
        {images.length > 1 && (
          <>            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 text-white hover:bg-black/40 rounded-full h-12 w-12 transition-opacity duration-200"              onClick={prevImageKeyboard}
              onMouseEnter={() => {
                // 显示上下栏
                setShowInfoBar(true);
                setShowThumbnails(true);
                
                // 清除所有定时器
                if (infoBarTimerRef.current) {
                  clearTimeout(infoBarTimerRef.current);
                  infoBarTimerRef.current = null;
                }
                
                if (thumbnailsTimerRef.current) {
                  clearTimeout(thumbnailsTimerRef.current);
                  thumbnailsTimerRef.current = null;
                }
              }}
            >
              <ChevronLeft className="h-7 w-7" />
            </Button>            <Button
              ref={rightArrowRef}
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 text-white hover:bg-black/40 rounded-full h-12 w-12 transition-opacity duration-200"              onClick={nextImageKeyboard}
              onMouseEnter={() => {
                // 显示上下栏
                setShowInfoBar(true);
                setShowThumbnails(true);
                
                // 清除所有定时器
                if (infoBarTimerRef.current) {
                  clearTimeout(infoBarTimerRef.current);
                  infoBarTimerRef.current = null;
                }
                
                if (thumbnailsTimerRef.current) {
                  clearTimeout(thumbnailsTimerRef.current);
                  thumbnailsTimerRef.current = null;
                }
              }}              onMouseLeave={(e) => {
                const relatedTarget = e.relatedTarget;
                
                // 检查relatedTarget是否为有效的DOM节点
                const isValidNode = relatedTarget instanceof Node;
                
                const isMovingToThumbnails = isValidNode && thumbnailsContainerRef.current && thumbnailsContainerRef.current.contains(relatedTarget as Node);
                const isMovingToContentBottom = isValidNode && contentRef.current && contentRef.current.contains(relatedTarget as Node) && (e.clientY - contentRef.current.getBoundingClientRect().top > contentRef.current.getBoundingClientRect().height * 0.7);

                if (!isMovingToThumbnails && !isMovingToContentBottom) {
                  // 鼠标离开箭头按钮时，开始自动隐藏定时器
                  setupAutoHideTimers();
                }
              }}
            >
              <ChevronRight className="h-7 w-7" />
            </Button>
          </>
        )}        {/* 图片计数指示器 - 只在多于一张图片时显示 */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 z-20 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {currentImageIndex + 1} / {images.length}
            {scale !== 1 && ` • ${Math.round(scale * 100)}%`}
          </div>
        )}
      </>
    );
  };    return (    <Dialog open={open} onOpenChange={onClose} modal={true}>      
      <CustomDialogContent className="w-screen h-screen max-w-none max-h-none p-0 overflow-hidden flex flex-col border-0 outline-none shadow-none sm:rounded-lg" style={{ height: '95vh', width: '95vw', boxShadow: 'none', border: 'none'}}>
        <DialogTitle className="sr-only">{albumTitle}</DialogTitle>
        <DialogDescription className="sr-only">{`${albumTitle} 相册图片浏览器`}</DialogDescription>
        {/* 全屏图片显示区 */}<div 
          ref={contentRef}          
          className="w-full overflow-hidden relative bg-black/90 flex-grow h-full touch-none select-none"
          style={{ 
            height: '100vh', /* 使用完整视口高度 */
            WebkitTapHighlightColor: 'transparent', /* 移除移动端点击高亮 */
            WebkitTouchCallout: 'none' /* 防止iOS长按弹出菜单 */ 
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}        >          {error ? (
            <div className="flex items-center justify-center h-full w-full text-red-500">
              {error}
            </div>
          ) : images.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-full w-full text-white">
              该相册没有图片
            </div>
          ) : (
            <>                <div 
                className="relative w-full h-full flex items-center justify-center" 
                style={{ height: '100%', position: 'absolute', inset: 0 }}
              >{/* 当前图片 */}
                <div className="absolute inset-0 w-full h-full"> {/* 使用absolute定位并填满整个容器 */}
                  <div 
                      className={`relative w-full h-full flex items-center justify-center ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      onClick={handleDoubleClick}
                      style={{ touchAction: scale > 1 ? 'pan-x pan-y' : 'none' }}
                    >
                    {/* 显示加载状态：当正在获取相册数据或当前图片未加载完成时 */}
                    {(loading || !currentImage || !imageLoaded) && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
                        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                      {/* 只有在有图片数据时才渲染Image组件 */}                    {currentImage && (                      <img
                        src={getImageUrl(currentImage.file_path)}
                        alt={currentImage?.alt_text || currentImage?.original_file_name || '相册图片'}
                        className={cn(
                          "object-contain transition-all duration-300 w-full h-full",
                          imageLoaded ? 'opacity-100' : 'opacity-0 blur-sm',
                          slideDirection === 'none' ? '' : 'scale-[0.98]'
                        )}
                        style={{
                          transition: `opacity ${BLUR_DURATION}ms ${FADE_EASING}, 
                                      filter ${BLUR_DURATION}ms ${FADE_EASING}, 
                                      transform ${isPinching ? '100ms' : TRANSITION_DURATION + 'ms'} ${SLIDE_EASING}`,
                          willChange: 'opacity, filter, transform',
                          objectFit: 'contain',
                          width: '100%',
                          height: '100%',
                          transform: `scale(${scale})`, // 应用缩放
                        }}
                        onLoad={handleImageLoad}
                        onError={(e) => {
                          // 尝试使用不同的URL格式重试加载
                          const currentSrc = e.currentTarget.src;
                          if (!currentSrc.includes('retry=true')) {
                            // 尝试添加时间戳或重试标记来绕过缓存
                            const retryUrl = `${getImageUrl(currentImage.file_path)}${getImageUrl(currentImage.file_path).includes('?') ? '&' : '?'}retry=true&t=${Date.now()}`;
                            e.currentTarget.src = retryUrl;
                          } else {
                            // 如果已经重试过，显示错误图片
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23191919'/%3E%3Cpath d='M35,45 L65,55 M35,55 L65,45' stroke='%23ffffff' stroke-width='3'/%3E%3Ctext x='50' y='65' font-family='Arial' font-size='12' text-anchor='middle' alignment-baseline='middle' fill='%23ffffff'%3E图片加载失败%3C/text%3E%3C/svg%3E";
                            setImageLoaded(true);
                          }
                        }}
                      />
                    )}
                  </div>                  {/* 过渡动画图片 */}
                  {slideDirection !== 'none' && currentImage && (
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        position: 'absolute', /* 明确设置position为absolute */
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 10,
                        transition: `transform ${TRANSITION_DURATION}ms ${SLIDE_EASING}, opacity ${TRANSITION_DURATION * 0.8}ms ${FADE_EASING}`,
                        transform: slideDirection === 'left' ? 'translateX(-100%)' : 'translateX(100%)',
                        opacity: 0.2,
                        willChange: 'transform, opacity'
                      }}
                    >                      <img
                        src={
                          slideDirection === 'right' 
                            ? getImageUrl(images[(currentImageIndex - 1 + images.length) % images.length]?.file_path)
                            : getImageUrl(images[(currentImageIndex + 1) % images.length]?.file_path)
                        }
                        alt="Previous image"
                        className="object-cover w-full h-full"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  )}</div>          {renderImageControls()}
              </div>            
            </>
          )}

          {/* 缩略图导航栏 */}
          {!loading && images.length > 1 && (
            <div
              ref={thumbnailsContainerRef}
              className={cn(
                "absolute bottom-0 left-0 right-0 z-10 w-full",
                "bg-gradient-to-t from-black/70 to-transparent",
                "transition-opacity duration-300 ease-in-out",
                showThumbnails ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              onMouseEnter={handleThumbnailsMouseEnter}
              onMouseLeave={handleThumbnailsMouseLeave}
            >
              <div 
                className="w-full flex flex-row overflow-x-auto py-3 px-4 h-[86px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900"
                style={{
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'thin',
                }}
              >
                <div className="flex flex-nowrap space-x-2 items-center">
                  {images.map((image, index) => (                    <div
                      key={image.id}
                      className={`flex-shrink-0 h-16 w-16 cursor-pointer overflow-hidden transition-all duration-200 rounded ${
                        index === currentImageIndex 
                          ? "ring-1 ring-white scale-105 shadow-lg brightness-110" 
                          : "opacity-70 hover:opacity-90 hover:scale-105 hover:shadow-sm brightness-90 hover:brightness-100"
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >                      <div className="relative w-16 h-16">
                        <Image
                          src={getThumbnailUrl(image.file_path)}
                          alt={image.alt_text || image.original_file_name || `图片 ${index + 1}`}
                          fill
                          sizes="64px"
                          className="object-cover rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CustomDialogContent>
    </Dialog>
  );
}
