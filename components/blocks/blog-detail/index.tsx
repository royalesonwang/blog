"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";

import Crumb from "./crumb";
import Markdown from "@/components/markdown";
import TableOfContents from "./table-of-contents";
import { Post } from "@/types/post";
import moment from "moment";

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
    </section>
  );
}
