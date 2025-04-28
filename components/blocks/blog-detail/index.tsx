"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

import Crumb from "./crumb";
import Markdown from "@/components/markdown";
import TableOfContents from "./table-of-contents";
import { Post } from "@/types/post";
import moment from "moment";

// 自定义的图片预览组件，专为博客详情页优化
function ImagePreview({ src, alt, onClose }: { src: string, alt?: string, onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const scrollPosition = useRef(0);

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

  // 防止滚动并记录滚动位置
  useEffect(() => {
    // 保存滚动位置
    scrollPosition.current = window.scrollY;
    
    // 计算滚动条宽度
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalPadding = getComputedStyle(document.body).paddingRight;
    
    // 锁定滚动，保持宽度
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollPosition.current}px`;
    document.body.style.width = "100%";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    
    return () => {
      // 恢复滚动 - 修复回到顶部的问题
      const scrollY = scrollPosition.current;
      
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.paddingRight = originalPadding;
      
      // 使用requestAnimationFrame确保DOM更新后再恢复滚动位置
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
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
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // 计算合适的样式
  const getImageStyle = () => {
    const isRotated = rotation % 180 !== 0;
    
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
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center"
          style={{ width: '100vw', height: '100vh' }}
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div 
            className="relative flex items-center justify-center w-full h-full p-4"
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

export default function BlogDetail({ post }: { post: Post }) {
  // 处理标签显示
  const tags = post.tag ? post.tag.split(',').map(tag => tag.trim()).filter(Boolean) : [];
  
  // 创建引用
  const contentRef = useRef<HTMLDivElement>(null);
  const tocContainerRef = useRef<HTMLDivElement>(null);
  const tocRef = useRef<HTMLDivElement>(null);
  
  // 创建状态
  const [tocStyles, setTocStyles] = useState({
    position: 'static' as 'static' | 'fixed' | 'absolute',
    top: 0,
    bottom: 'auto',
    width: 0
  });
  
  // 图片预览状态
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewAlt, setPreviewAlt] = useState('');
  
  useEffect(() => {
    // 初始设置宽度
    if (tocContainerRef.current) {
      setTocStyles(prev => ({
        ...prev,
        width: tocContainerRef.current?.offsetWidth || 0
      }));
    }
    
    // 滚动偏移量存储，用于平滑计算
    let lastScrollY = window.scrollY;
    let scrollDirection = 'down';
    
    // 状态追踪，用于防止频繁切换
    let lastPositionState = 'fixed';
    let stateStableCounter = 0;
    
    // 监听滚动和窗口大小变化
    const handlePositioning = () => {
      if (!tocContainerRef.current || !tocRef.current || !contentRef.current) return;
      
      // 确定滚动方向
      const currentScrollY = window.scrollY;
      scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
      lastScrollY = currentScrollY;
      
      // 获取各元素位置信息
      const tocHeight = tocRef.current.offsetHeight;
      const containerRect = tocContainerRef.current.getBoundingClientRect();
      const containerTop = containerRect.top;
      const containerHeight = contentRef.current.offsetHeight;
      
      // 计算内容区域的底部位置
      const footer = document.querySelector('footer');
      const footerTop = footer ? footer.getBoundingClientRect().top : window.innerHeight;
      
      // 设置缓冲区，使TOC在接近footer前停止
      const buffer = 60; // 底部缓冲距离
      const headerHeight = 96; // 顶部固定高度 (24px * 4)
      
      // 获取可视区域高度
      const viewportHeight = window.innerHeight;
      
      // 只有当footer真正接近视口底部时才需要绝对定位
      // 计算footer与视口底部的距离
      const footerBottomDistance = viewportHeight - footerTop;
      
      // 底部触发区域：footer进入视口且已经显示了一定比例
      // 调整这个值可以控制目录开始跟随的时机
      const bottomTriggerThreshold = Math.min(tocHeight * 0.5, 150); // 目录高度的50%或最多150px
      
      // 使用更保守的触发条件，确保只有接近底部时才会跟随
      const shouldStickToBottom = footerBottomDistance > bottomTriggerThreshold && 
                                 (footerTop < viewportHeight * 0.9); // footer至少进入视口10%
      
      // 计算内容区与页脚的相对关系
      const contentElement = document.querySelector('.container.relative');
      const contentBottom = contentElement ? contentElement.getBoundingClientRect().bottom : window.innerHeight;
      
      if (containerTop <= headerHeight) {
        // 如果已经滚动超过了headerHeight（需要考虑目录固定）
        
        // 当前理想的定位状态
        let currentIdealPositionState;
        
        // 只有当footer接近视口底部时才改变定位方式
        if (shouldStickToBottom) {
          currentIdealPositionState = 'absolute';
          
          // 计算底部偏移量，基于footer与视口底部的距离
          // 这个公式确保了更平滑的过渡
          const transitionRatio = Math.min(1, (footerBottomDistance - bottomTriggerThreshold) / (tocHeight * 0.7));
          
          // 计算目录的最终位置
          // 向下滚动时让目录更跟随页面
          let targetTop = containerHeight - tocHeight - (transitionRatio * buffer);
          
          // 向上滚动时稍微减弱跟随效果，使过渡更平滑
          if (scrollDirection === 'up') {
            const dampingFactor = 0.7; // 阻尼因子，减少向上滚动时的跟随强度
            targetTop += (1 - transitionRatio) * dampingFactor * buffer;
          }
          
          // 应用绝对定位，让目录跟随到底部
          setTocStyles({
            position: 'absolute',
            top: targetTop,
            bottom: 'auto',
            width: containerRect.width
          });
        } else {
          currentIdealPositionState = 'fixed';
          
          // 中间滚动区域，使用固定定位
          setTocStyles({
            position: 'fixed',
            top: headerHeight,
            bottom: 'auto',
            width: containerRect.width
          });
        }
        
        // 防抖：如果状态变化，重置计数器；如果状态稳定，增加计数
        if (currentIdealPositionState !== lastPositionState) {
          stateStableCounter = 0;
        } else {
          stateStableCounter++;
        }
        
        // 记录本次状态，用于下次比较
        lastPositionState = currentIdealPositionState;
      } else {
        // 顶部区域，使用静态定位
        setTocStyles({
          position: 'static',
          top: 0,
          bottom: 'auto',
          width: containerRect.width
        });
        
        // 重置状态记录
        lastPositionState = 'static';
        stateStableCounter = 0;
      }
    };
    
    // 添加监听器，使用节流来提高性能
    let ticking = false;
    let lastScrollTime = 0;
    const scrollThreshold = 10; // 滚动防抖阈值（毫秒）
    
    const throttledScroll = () => {
      const now = Date.now();
      
      // 使用时间防抖，减少快速滚动时的计算次数
      if (!ticking && (now - lastScrollTime > scrollThreshold)) {
        window.requestAnimationFrame(() => {
          handlePositioning();
          ticking = false;
          lastScrollTime = now;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', throttledScroll);
    window.addEventListener('resize', handlePositioning);
    
    // 初始计算一次
    handlePositioning();
    
    // 清理函数
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('resize', handlePositioning);
    };
  }, []);

  // 添加图片点击事件监听器
  useEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // 检查点击的是否为文章内容中的图片
      if (target.tagName === 'IMG' && contentRef.current?.contains(target)) {
        // 防止事件冒泡和默认行为
        e.preventDefault();
        e.stopPropagation();
        
        // 获取图片信息
        const imgElement = target as HTMLImageElement;
        setPreviewSrc(imgElement.src);
        setPreviewAlt(imgElement.alt || '图片预览');
        setPreviewOpen(true);
      }
    };
    
    // 为内容区域添加点击事件委托
    document.addEventListener('click', handleImageClick, true);
    
    return () => {
      document.removeEventListener('click', handleImageClick, true);
    };
  }, []);
  
  return (
    <section className="py-16">
      <div className="container relative">
        <Crumb post={post} />
        <h1 className="mb-2 mt-9 max-w-3xl text-2xl font-bold md:mb-5 md:text-4xl">
          {post.title}
        </h1>
        <div className="flex items-center gap-3 text-sm md:text-base">
          {post.author_avatar_url && (
            <Avatar className="h-8 w-8 border">
              <AvatarImage
                src={post.author_avatar_url}
                alt={post.author_name}
              />
            </Avatar>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {post.author_name && (
              <a href="javascript:void(0)" className="font-medium">
                {post.author_name}
              </a>
            )}

            <span className="text-muted-foreground">
              on {post.created_at && moment(post.created_at).fromNow()}
            </span>
            
            {/* 标签显示 */}
            {tags.length > 0 && (
              <div className="flex items-center gap-1 ml-2">
                <span className="text-muted-foreground">•</span>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="my-2 mb-4 border-t border-border"></div>
        
        {/* 文章内容区域：左侧目录，右侧内容 */}
        <div className="flex" ref={contentRef}>
          {/* 左侧目录导航 */}
          <div 
            className="hidden lg:block lg:w-64 lg:flex-none" 
            ref={tocContainerRef}
          >
            <div 
              ref={tocRef}
                 style={{ 
                position: tocStyles.position,
                top: tocStyles.position === 'fixed' || tocStyles.position === 'absolute' 
                  ? tocStyles.top 
                  : 'auto',
                width: tocStyles.position !== 'static' ? tocStyles.width : 'auto',
                maxHeight: '50vh',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent',
                transition: tocStyles.position === 'absolute' 
                  ? 'top 0.5s cubic-bezier(0.33, 1, 0.68, 1)' 
                  : 'top 0.3s ease, position 0.3s ease',
                willChange: 'position, top'
              }}
              className="pr-4"
            >
                {post.content && <TableOfContents content={post.content} />}
              </div>
            </div>
            
            {/* 右侧文章内容 */}
            <div className="flex-1 lg:ml-8">
              {post.content && <Markdown content={post.content} />}
              
              {/* 移动设备上的目录，显示在内容下方 */}
              <div className="mt-8 lg:hidden">
                {post.content && <TableOfContents content={post.content} />}
              </div>
            </div>
          </div>
        </div>
      
      {/* 图片预览组件 */}
      {previewOpen && (
        <ImagePreview 
          src={previewSrc} 
          alt={previewAlt} 
          onClose={() => setPreviewOpen(false)} 
        />
      )}
    </section>
  );
}
