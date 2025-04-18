"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";

import Crumb from "./crumb";
import Markdown from "@/components/markdown";
import TableOfContents from "./table-of-contents";
import { Post } from "@/types/post";
import moment from "moment";

export default function BlogDetail({ post }: { post: Post }) {
  // 使用简单的状态控制是否显示固定目录
  const [showFixedToc, setShowFixedToc] = useState(false);
  // 直接引用目录容器
  const tocRef = useRef<HTMLDivElement>(null);
  const [tocPosition, setTocPosition] = useState({ left: 0, width: 0 });
  
  // 处理标签显示
  const tags = post.tag ? post.tag.split(',').map(tag => tag.trim()).filter(Boolean) : [];
  
  useEffect(() => {
    // 计算目录位置
    const updatePosition = () => {
      if (tocRef.current) {
        const rect = tocRef.current.getBoundingClientRect();
        setTocPosition({
          left: rect.left,
          width: rect.width
        });
      }
    };
    
    // 初始计算一次
    updatePosition();
    
    // 滚动处理函数
    const handleScroll = () => {
      // 简单判断：当页面滚动超过200px时显示固定目录
      setShowFixedToc(window.scrollY > 200);
      // 更新位置（因为滚动可能影响位置）
      if (!showFixedToc) {
        updatePosition();
      }
    };
    
    // 窗口大小变化时重新计算位置
    const handleResize = () => {
      updatePosition();
    };
    
    // 添加事件监听
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // 清理函数
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [showFixedToc]);

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
        <div className="relative">
          {/* 桌面版固定目录 - 完全独立于布局流，只在滚动时显示 */}
          {showFixedToc && (
            <div className="fixed top-24 z-10 hidden lg:block" 
                 style={{ 
                   width: `${tocPosition.width}px`,
                   left: `${tocPosition.left}px` 
                 }}>
              {post.content && <TableOfContents content={post.content} />}
            </div>
          )}
          
          {/* 主内容布局 - 在所有状态下保持一致 */}
          <div className="flex">
            {/* 左侧目录导航 - 始终保持相同宽度的占位，但内容在滚动后隐藏 */}
            <div className="hidden lg:block lg:w-64 lg:flex-none" ref={tocRef}>
              <div className={showFixedToc ? 'opacity-0' : 'opacity-100'}>
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
      </div>
    </section>
  );
}
